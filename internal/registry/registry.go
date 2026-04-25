package registry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type Package struct {
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	Description string   `json:"description"`
	Author      string   `json:"author,omitempty"`
	Source      string   `json:"source"`
	Tags        []string `json:"tags,omitempty"`
}

type Index struct {
	Packages []Package `json:"packages"`
}

func FetchIndex(url string) (*Index, error) {
	if isLocalPath(url) {
		return loadLocal(url)
	}
	return loadRemote(url)
}

func (idx *Index) Find(name string) (*Package, bool) {
	for i := range idx.Packages {
		if idx.Packages[i].Name == name {
			return &idx.Packages[i], true
		}
	}
	return nil, false
}

func loadRemote(url string) (*Index, error) {
	resp, err := http.Get(url) //nolint:gosec
	if err != nil {
		return nil, fmt.Errorf("failed to reach registry: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registry returned HTTP %d", resp.StatusCode)
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read registry: %w", err)
	}
	return parse(data)
}

func loadLocal(path string) (*Index, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read local registry %s: %w", path, err)
	}
	return parse(data)
}

func parse(data []byte) (*Index, error) {
	var idx Index
	if err := json.Unmarshal(data, &idx); err != nil {
		return nil, fmt.Errorf("invalid registry format: %w", err)
	}
	return &idx, nil
}

func isLocalPath(s string) bool {
	return strings.HasPrefix(s, "/") || strings.HasPrefix(s, "./") || strings.HasPrefix(s, "../")
}
