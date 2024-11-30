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

	settings "github.com/karl1b/go4lage/pkg/settings"
	"golang.org/x/crypto/bcrypt"
)

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
	Error  string `json:"error"`
}

type ToastResponse struct {
	Header string `json:"header"`
	Text   string `json:"text"`
}

func SetUp() (*sql.DB, func()) {

	if settings.Settings.DbURL == "" {
		log.Fatal("DB_URL is empty")
	}

	conn, err := sql.Open("postgres", settings.Settings.DbURL)
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

func FileCacheInit(baseDir string, baseUrl string, apiUrl string, port string, cache *map[string][]byte) error {

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

			(*cache)[npath] = data
		}
		return nil
	})

	if err != nil {
		log.Fatalf("Failed to load static files: %v", err)
	}

	// Replaces the Baseurl
	for path, file := range *cache {
		if strings.HasSuffix(path, ".html") || strings.HasSuffix(path, ".js") {
			baseUrl = strings.TrimSpace(baseUrl)
			replacedContent := strings.ReplaceAll(string(file), "{%Baseurl%}", baseUrl)
			extensions := []string{".png", ".jpg", ".js ", ".css"}
			replacedContent = ApplyCacheBuster(replacedContent, extensions) // With this cache buster in place you can cache agressively.
			(*cache)[path] = []byte(replacedContent)
		}
	}

	// Replaces the Apiurl
	for path, file := range *cache {
		if strings.HasSuffix(path, ".html") || strings.HasSuffix(path, ".js") {
			apiUrl = strings.TrimSpace(apiUrl)

			replacedContent := strings.ReplaceAll(string(file), "{%Apiurl%}", apiUrl)
			extensions := []string{".png", ".jpg", ".js ", ".css"}
			replacedContent = ApplyCacheBuster(replacedContent, extensions) // With this cache buster in place you can cache agressively.
			(*cache)[path] = []byte(replacedContent)
		}
	}
	re := regexp.MustCompile(`\{%([^%}])*%\}`)

	// Defines the non dynamic placeholder {%%}

	regexFound := false
	for range 10 {

		// Perform the placeholder replacement for each file
		for path, content := range *cache {
			updatedContent, replaced := replacePlaceholders(string(content), re, cache)
			if replaced {
				(*cache)[path] = []byte(updatedContent)
			}
			if re.Match((*cache)[path]) {
				regexFound = true
			}
		}

		if !regexFound {
			return nil
		}
		regexFound = false

	}
	var badpaths []string

	for path := range *cache {
		if re.Match((*cache)[path]) {
			badpaths = append(badpaths, path)
		}
	}

	log.Fatal("Do you have a cyclic component?: ", badpaths)
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

func replacePlaceholders(content string, re *regexp.Regexp, cache *map[string][]byte) (string, bool) {
	replacementMade := false

	result := re.ReplaceAllStringFunc(content, func(match string) string {
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

		// Check if the key exists in the cache
		lookKey, err := CacheReader(key)
		if err != nil {
			log.Fatalf("Error CacheReader: %v", err)
		}

		if replacement, exists := (*cache)[lookKey]; exists {
			if re.Match(replacement) {
				// If the replacement still contains a regex match,
				// return the original match without marking as replaced
				return match
			} else {
				replacementMade = true
				return string(replacement)
			}
		}

		// If the key doesn't exist in the cache, return the original match
		return match
	})

	return result, replacementMade
}

func RespondWithJSON(w http.ResponseWriter, payload interface{}) {
	var dat []byte
	statuscode := 200
	w.Header().Add("Content-Type", "application/json")

	if errorResp, ok := payload.(*ErrorResponse); ok {
		statuscode = 400
		if !settings.Settings.Debug {
			cleanedPayload := ErrorResponse{
				Detail: errorResp.Detail,
				Error:  "",
			}
			dat, _ = json.Marshal(cleanedPayload)

			w.WriteHeader(statuscode)
			w.Write(dat)
			return

		}

	}

	dat, _ = json.Marshal(payload)

	w.WriteHeader(statuscode)
	w.Write(dat)

}
