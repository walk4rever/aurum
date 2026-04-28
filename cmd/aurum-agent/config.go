package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const (
	configFilename = ".aurum.json"
	defaultAPIURL  = "https://aurum.air7.fun"
)

type Config struct {
	Address string `json:"address"`
	APIKey  string `json:"api_key"`
	APIURL  string `json:"api_url,omitempty"`
}

// localPart returns the part before @ (e.g. "monia.rafael" from "monia.rafael@air7.fun").
func (c *Config) localPart() string {
	at := strings.Index(c.Address, "@")
	if at < 0 {
		return c.Address
	}
	return c.Address[:at]
}

func configPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("cannot find home directory: %w", err)
	}
	return filepath.Join(home, configFilename), nil
}

func loadConfig() (*Config, error) {
	cfg := &Config{
		Address: os.Getenv("AURUM_ADDRESS"),
		APIKey:  os.Getenv("AURUM_API_KEY"),
		APIURL:  os.Getenv("AURUM_API_URL"),
	}

	if cfg.Address == "" || cfg.APIKey == "" {
		path, err := configPath()
		if err != nil {
			return nil, err
		}
		data, err := os.ReadFile(path)
		if err == nil {
			var fileCfg Config
			if json.Unmarshal(data, &fileCfg) == nil {
				if cfg.Address == "" {
					cfg.Address = fileCfg.Address
				}
				if cfg.APIKey == "" {
					cfg.APIKey = fileCfg.APIKey
				}
				if cfg.APIURL == "" {
					cfg.APIURL = fileCfg.APIURL
				}
			}
		}
	}

	if cfg.APIURL == "" {
		cfg.APIURL = defaultAPIURL
	}

	return cfg, nil
}

func saveConfig(cfg *Config) error {
	path, err := configPath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

func requireConfig() *Config {
	cfg, err := loadConfig()
	if err != nil {
		fatalf("%v", err)
	}
	if cfg.Address == "" {
		fatalf("no address configured\nRun: aurum-agent init --address <addr> --key <api-key>")
	}
	if cfg.APIKey == "" {
		fatalf("no API key configured\nRun: aurum-agent init --address <addr> --key <api-key>")
	}
	return cfg
}
