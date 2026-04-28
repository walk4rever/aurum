package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"
)

func cmdWatch(args []string) {
	fs := flag.NewFlagSet("watch", flag.ExitOnError)
	interval := fs.Int("interval", 30, "poll interval in seconds")
	limit := fs.Int("limit", 50, "max number of messages to fetch each poll")
	asJSON := fs.Bool("json", false, "output each new message as JSON object")
	fs.Parse(args)

	if *interval <= 0 {
		fatalf("--interval must be > 0")
	}
	if *limit <= 0 {
		fatalf("--limit must be > 0")
	}

	cfg := requireConfig()

	seen := make(map[string]struct{})
	initial, err := fetchInbox(cfg, nil, *limit)
	if err != nil {
		fatalf("%v", err)
	}
	for _, m := range initial {
		if m.ID == "" {
			continue
		}
		seen[m.ID] = struct{}{}
	}

	var enc *json.Encoder
	if *asJSON {
		enc = json.NewEncoder(os.Stdout)
	}

	ticker := time.NewTicker(time.Duration(*interval) * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		messages, err := fetchInbox(cfg, nil, *limit)
		if err != nil {
			fatalf("%v", err)
		}

		var newMessages []Message
		for _, m := range messages {
			if m.ID == "" {
				continue
			}
			if _, ok := seen[m.ID]; ok {
				continue
			}
			seen[m.ID] = struct{}{}
			newMessages = append(newMessages, m)
		}

		for i := len(newMessages) - 1; i >= 0; i-- {
			m := newMessages[i]
			if enc != nil {
				enc.Encode(m)
				continue
			}
			fmt.Printf("From: %s\nSubject: %s\nReceived: %s\n\n%s\n\n", m.FromAddr, m.Subject, m.ReceivedAt.Format(time.RFC3339), m.BodyText)
		}
	}
}
