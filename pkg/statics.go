package go4lage

import (
	"log"
	"net/http"
	"strings"

	"github.com/karl1b/go4lage/pkg/utils"
)

var rootFiles map[string][]byte

func init() {
	rootFiles = make(map[string][]byte)
	utils.FileCacheInit("root", Settings.Baseurl, Settings.Apiurl, Settings.ApiPort, &rootFiles)
}

func root(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		r.URL.Path = "/index.html"
	}
	if r.URL.Path == "/admin" {
		r.URL.Path = "/admin/index.html"
	}
	serveFiles(w, r, &rootFiles, []string{"", "/admin"})
}

// Get the correct static file from the cache and serve it
func serveFiles(w http.ResponseWriter, r *http.Request, files *map[string][]byte, pathVariants []string) {

	searcherFunc := func(pathVariant string) bool {

		path := (pathVariant + r.URL.Path)[1:]

		path, err := utils.CacheReader(path)

		if err != nil {
			log.Println("Error cache reader", err)
		}
		if data, ok := (*files)[path]; ok {
			switch {
			case strings.HasSuffix(path, ".html"):
				w.Header().Set("Content-Type", "text/html")
			case strings.HasSuffix(path, ".css"):
				w.Header().Set("Content-Type", "text/css")
			case strings.HasSuffix(path, ".js"):
				w.Header().Set("Content-Type", "application/javascript")
			case strings.HasSuffix(path, ".png"):
				w.Header().Set("Content-Type", "image/png")
			case strings.HasSuffix(path, ".jpg"), strings.HasSuffix(path, ".jpeg"):
				w.Header().Set("Content-Type", "image/jpeg")
			case strings.HasSuffix(path, ".gif"):
				w.Header().Set("Content-Type", "image/gif")
			case strings.HasSuffix(path, ".svg"):
				w.Header().Set("Content-Type", "image/svg+xml")
			case strings.HasSuffix(path, ".json"):
				w.Header().Set("Content-Type", "application/json")
			case strings.HasSuffix(path, ".xml"):
				w.Header().Set("Content-Type", "application/xml")
			case strings.HasSuffix(path, ".pdf"):
				w.Header().Set("Content-Type", "application/pdf")
			default:
				w.Header().Set("Content-Type", "text/html") // Setting default as text html.
			}
			w.Write(data)
			return true
		}
		return false
	}

	for _, pathVar := range pathVariants {

		if searcherFunc(pathVar) {
			return
		}

	}

	http.NotFound(w, r)

}
