package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"
)

func cmdInbox(args []string) {
	fs := flag.NewFlagSet("inbox", flag.ExitOnError)
	since := fs.String("since", "", "show messages since (e.g. 30m, 2h, 7d)")
	limit := fs.Int("limit", 50, "max number of messages")
	asJSON := fs.Bool("json", false, "output as JSON array")
	fs.Parse(args)

	cfg := requireConfig()

	var sinceTime *time.Time
	if *since != "" {
		t, err := parseRelTime(*since)
		if err != nil {
			fatalf("--since: %v", err)
		}
		sinceTime = &t
	}

	messages, err := fetchInbox(cfg, sinceTime, *limit)
	if err != nil {
		fatalf("%v", err)
	}

	if *asJSON {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		enc.Encode(messages)
		return
	}

	if len(messages) == 0 {
		fmt.Println("No messages.")
		return
	}

	fmt.Printf("%-34s %-42s %s\n", "FROM", "SUBJECT", "RECEIVED")
	fmt.Println(strings.Repeat("─", 90))
	for _, m := range messages {
		fmt.Printf("%-34s %-42s %s\n",
			truncate(m.FromAddr, 32),
			truncate(m.Subject, 40),
			formatAge(time.Since(m.ReceivedAt)),
		)
	}
}

func formatAge(d time.Duration) string {
	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		return fmt.Sprintf("%dm ago", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh ago", int(d.Hours()))
	default:
		return fmt.Sprintf("%dd ago", int(d.Hours()/24))
	}
}

func truncate(s string, n int) string {
	if len([]rune(s)) <= n {
		return s
	}
	return string([]rune(s)[:n-1]) + "…"
}
