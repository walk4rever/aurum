package installer

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/walk4rever/aurum/internal/manifest"
	"github.com/walk4rever/aurum/internal/registry"
)

type Installer struct {
	installDir string
}

func New(installDir string) *Installer {
	return &Installer{installDir: expandHome(installDir)}
}

func (ins *Installer) Install(pkg *registry.Package) error {
	tmpDir, err := os.MkdirTemp("", "aurum-install-*")
	if err != nil {
		return fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	fmt.Printf("Fetching %s from %s\n", pkg.Name, pkg.Source)
	cmd := exec.Command("git", "clone", "--depth=1", pkg.Source, tmpDir)
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git clone failed: %w", err)
	}

	m, err := manifest.Load(tmpDir)
	if err != nil {
		return fmt.Errorf("package has no aurum.json: %w", err)
	}

	destDir := filepath.Join(ins.installDir, m.Name)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("failed to create install dir: %w", err)
	}

	for _, skillPath := range m.Skills {
		src := filepath.Join(tmpDir, skillPath)
		dst := filepath.Join(destDir, filepath.Base(skillPath))
		fmt.Printf("  + %s\n", filepath.Base(skillPath))
		if err := copyDir(src, dst); err != nil {
			return fmt.Errorf("failed to copy %s: %w", skillPath, err)
		}
	}

	fmt.Printf("\nInstalled %s@%s\n", m.Name, m.Version)
	fmt.Printf("Location: %s\n", destDir)
	fmt.Printf("\nTo load in Claude Code, add to ~/.claude/settings.json:\n")
	fmt.Printf(`  "skillPaths": ["%s"]`+"\n", destDir)
	return nil
}

func copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(src, path)
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, info.Mode())
		}
		return copyFile(path, target, info.Mode())
	})
}

func copyFile(src, dst string, mode os.FileMode) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, mode)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func expandHome(path string) string {
	if strings.HasPrefix(path, "~/") {
		home, _ := os.UserHomeDir()
		return filepath.Join(home, path[2:])
	}
	return path
}
