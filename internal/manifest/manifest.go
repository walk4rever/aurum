package manifest

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type Manifest struct {
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	Description string   `json:"description"`
	Author      string   `json:"author,omitempty"`
	License     string   `json:"license,omitempty"`
	Homepage    string   `json:"homepage,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	Skills      []string `json:"skills"`
	Tools       string   `json:"tools,omitempty"`
}

func Load(dir string) (*Manifest, error) {
	path := filepath.Join(dir, "aurum.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("aurum.json not found in %s", dir)
	}
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("invalid aurum.json: %w", err)
	}
	return &m, nil
}

func Validate(m *Manifest) []string {
	var errs []string
	if m.Name == "" {
		errs = append(errs, "name is required")
	}
	if m.Version == "" {
		errs = append(errs, "version is required")
	}
	if m.Description == "" {
		errs = append(errs, "description is required")
	}
	if len(m.Skills) == 0 {
		errs = append(errs, "at least one entry in skills[] is required")
	}
	return errs
}
