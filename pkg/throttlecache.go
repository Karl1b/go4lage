package go4lage

import (
	"errors"
	"sync"
	"time"
)

/*
The throttlecache is there to prevent a login force attack.
*/
type Throttlecache struct {
	mu        sync.Mutex
	breaktime map[string]int64
}

var loginthrottler Throttlecache

func init() {
	loginthrottler = Throttlecache{
		breaktime: make(map[string]int64),
	}
}

// Checks if the user can call again.
// Returns an error if not.
func (t *Throttlecache) check(ip string) error {
	defer t.mu.Unlock()
	t.mu.Lock()
	unixTimeNow := time.Now().Unix()
	if nextAllowedTime, exists := t.breaktime[ip]; exists && unixTimeNow < nextAllowedTime {
		t.breaktime[ip] = t.breaktime[ip] + int64(Settings.LoginThrottleTimeS) // the next login attempt is allowed in 1 sec.
		return errors.New("too many requests")
	}
	if nextAllowedTime, exists := t.breaktime[ip]; exists && unixTimeNow >= nextAllowedTime {
		delete(t.breaktime, ip) // If a user was okay its breaktime will be deleted. Very small performance gain.
		return nil
	}
	t.breaktime[ip] = unixTimeNow + int64(Settings.LoginThrottleTimeS)
	return nil
}
