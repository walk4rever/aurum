package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

func cmdInit(args []string) {
	fs := flag.NewFlagSet("init", flag.ExitOnError)
	address := fs.String("address", "", "agent address (e.g. monia.rafael@air7.fun)")
	key := fs.String("key", "", "API key from dashboard")
	apiURL := fs.String("api-url", "", "override API base URL (optional)")
	fs.Parse(args)

	if *address == "" || *key == "" {
		fatalf("--address and --key are required")
	}

	cfg := &Config{
		Address: *address,
		APIKey:  *key,
		APIURL:  *apiURL,
	}

	if err := saveConfig(cfg); err != nil {
		fatalf("failed to save config: %v", err)
	}

	home, _ := os.UserHomeDir()
	fmt.Printf("✓ Configured %s\n", cfg.Address)
	fmt.Printf("  config: %s\n", filepath.Join(home, configFilename))
	fmt.Println()
	fmt.Println("Try it:")
	fmt.Println("  aurum-agent inbox")
}
