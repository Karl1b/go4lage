package utils

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/joho/godotenv"
)

type UserKey struct{}

func IsValidEmail(email string) bool {
	// Regular expression for validating an email address
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
	return emailRegex.MatchString(strings.ToLower(email))
}

func GenerateTokenHex(nBytes int) (string, error) {
	bytes := make([]byte, nBytes)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	token := hex.EncodeToString(bytes)
	return token, nil
}

func HashPassword(password string) (string, error) {

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func CompareHashAndPassword(hash, password string) error {

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		return err
	}
	return nil
}

type ErrorResponse struct {
	Detail string `json:"detail"`
	Error  error  `json:"error"`
}

type ToastResponse struct {
	Header string `json:"header"`
	Text   string `json:"text"`
}

func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	dat, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Failed to Marshal JSON %v \n", payload)
		w.WriteHeader(500)
		return
	}
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(dat)
}

func RespondWithText(w http.ResponseWriter, code int, text string) {
	w.Header().Add("Content-Type", "text/plain")
	w.WriteHeader(code)
	_, err := w.Write([]byte(text))
	if err != nil {
		log.Printf("Failed to write text response: %v \n", err)
	}
}

func SetUp() (*sql.DB, func()) {
	godotenv.Load(".env")
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL is empty")
	}

	conn, err := sql.Open("postgres", dbURL)
	if err != nil {

		log.Fatal("Can not connect to DB", err)
	}
	return conn, func() {
		err := conn.Close()
		if err != nil {
			log.Fatal("Can not close DB", err)
		}
	}
}

func FileCacheInit(baseDir string, baseUrl string, apiUrl string, apiPort string, cache *map[string][]byte) error {

	urlReplacer := func(urls []string, path string, file []byte) (replacedBytes []byte) {
		replacedBytes = file
		for _, url := range urls {
			if strings.HasSuffix(path, ".html") || strings.HasSuffix(path, ".js") {
				replacedContent := strings.ReplaceAll(string(file), url, baseUrl)
				extensions := []string{".png", ".jpg", ".js ", ".css"}
				replacedContent = ApplyCacheBuster(replacedContent, extensions) // With this cache buster in place you can cache agressively.
				replacedBytes = []byte(replacedContent)
			}

		}
		return replacedBytes
	}

	re := regexp.MustCompile(`\{\%.*?\%\}`)
	dirtcache := make(map[string][]byte)

	err := filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			data, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			npath := strings.Join(strings.Split(path, "/")[1:], "/")

			if re.Match(data) {
				dirtcache[npath] = urlReplacer([]string{"{%Baseurl%}", "{%Apiurl%}"}, path, data)

			} else {
				(*cache)[npath] = urlReplacer([]string{"{%Baseurl%}", "{%Apiurl%}"}, path, data)
			}

		}
		return nil
	})
	if err != nil {
		log.Fatalf("Failed to load static files: %v", err)
	}

	replacer := func(cache *map[string][]byte, dirtcache *map[string][]byte) (int, error) {

		numberOfReplacements := 0

		// Defines the non dynamic placeholder {%%}
		//re := regexp.MustCompile(`\{\%.*?\%\}`)
		// Perform the placeholder replacement for each file

		for path, content := range *dirtcache {

			updatedContent := re.ReplaceAllStringFunc(string(content), func(match string) string {
				// Trim the surrounding {% and %} from the match
				trimSpecific := func(match string) string {
					prefix := "{%"
					suffix := "%}"
					if strings.HasPrefix(match, prefix) && strings.HasSuffix(match, suffix) {
						return match[len(prefix) : len(match)-len(suffix)]
					}
					return match
				}

				key := trimSpecific(match)

				// Check if the key exists in the *cache

				lookKey, err := CacheReader(key)
				if err != nil {
					log.Fatal("Errror Cachereader :", err)
				}

				if replacement, exists := (*cache)[lookKey]; exists {
					numberOfReplacements++
					return string(replacement)
				} else {
					return match
				}
			})

			if string([]byte(updatedContent)) != string(content) {
				if !re.Match((*dirtcache)[path]) {
					delete((*dirtcache), path)
				} else {
					(*dirtcache)[path] = []byte(updatedContent)
				}
				(*cache)[path] = []byte(updatedContent)
			}

		}
		return numberOfReplacements, nil
	}

	for range 10 {
		replaced, err := replacer(cache, &dirtcache)
		if err != nil {
			log.Fatal(err)
		}
		if replaced == 0 {
			return nil
		}
	}
	log.Fatal("Replacer not ending, do you have got a cyclic component issue?")
	return nil
}

// Replaces file paths in the content with paths that include a cache buster string.
func ApplyCacheBuster(content string, extensions []string) string {
	for _, ext := range extensions {
		buster := addCacheBuster() + ext
		content = strings.ReplaceAll(content, ext, buster)
	}
	return content
}

// Adds -- and random stuff to the filename
func addCacheBuster() string {
	randomBytes := make([]byte, 3) // 6 bytes generate 12 hex characters
	if _, err := rand.Read(randomBytes); err != nil {
		// Handle the error by returning it
		log.Fatal(err)
	}
	randomStr := hex.EncodeToString(randomBytes)
	return "--" + randomStr
}

// cacheReader processes a file path by removing characters after '--' and ensuring it has an appropriate extension.
func CacheReader(path string) (string, error) {
	index := strings.Index(path, "--")
	if index != -1 {
		ext := filepath.Ext(path)
		if ext == "" {
			ext = ".html" // Default to .html if there is no file extension
		}
		// Remove characters after '--' and ensure the path has an extension.
		path = path[:index] + ext
	} else {
		// If '--' is not found, check if an extension is present; add .html if not.
		if filepath.Ext(path) == "" {
			path += ".html"
		}
	}
	return path, nil
}
