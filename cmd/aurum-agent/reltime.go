package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// parseRelTime parses relative time strings like "30m", "2h", "7d"
// and returns the absolute time that many units in the past.
func parseRelTime(s string) (time.Time, error) {
	s = strings.TrimSpace(strings.ToLower(s))
	if s == "" {
		return time.Time{}, fmt.Errorf("empty time string")
	}

	unit := s[len(s)-1]
	n, err := strconv.Atoi(s[:len(s)-1])
	if err != nil || n <= 0 {
		return time.Time{}, fmt.Errorf("invalid relative time %q (examples: 30m, 2h, 7d)", s)
	}

	switch unit {
	case 'm':
		return time.Now().Add(-time.Duration(n) * time.Minute), nil
	case 'h':
		return time.Now().Add(-time.Duration(n) * time.Hour), nil
	case 'd':
		return time.Now().Add(-time.Duration(n) * 24 * time.Hour), nil
	default:
		return time.Time{}, fmt.Errorf("unknown unit %q — use m (minutes), h (hours), or d (days)", string(unit))
	}
}
