package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
)

func cmdSend(args []string) {
	fs := flag.NewFlagSet("send", flag.ExitOnError)
	to := fs.String("to", "", "recipient email address (required)")
	subject := fs.String("subject", "", "email subject (required)")
	body := fs.String("body", "", "message body (omit to read from stdin)")
	fs.Parse(args)

	if *to == "" || *subject == "" {
		fatalf("--to and --subject are required")
	}

	text := *body
	if text == "" && !isTerminal(os.Stdin) {
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			fatalf("failed to read stdin: %v", err)
		}
		text = strings.TrimRight(string(data), "\n")
	}

	cfg := requireConfig()

	from, err := sendMessage(cfg, *to, *subject, text)
	if err != nil {
		fatalf("%v", err)
	}

	fmt.Printf("✓ Sent  %s → %s\n", from, *to)
}

func isTerminal(f *os.File) bool {
	fi, err := f.Stat()
	if err != nil {
		return false
	}
	return (fi.Mode() & os.ModeCharDevice) != 0
}
