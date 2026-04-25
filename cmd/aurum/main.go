package main

import (
	"fmt"
	"os"

	"github.com/walk4rever/aurum/internal/config"
	"github.com/walk4rever/aurum/internal/installer"
	"github.com/walk4rever/aurum/internal/manifest"
	"github.com/walk4rever/aurum/internal/registry"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "list":
		cmdList()
	case "install":
		if len(os.Args) < 3 {
			fatalf("usage: aurum install <package>")
		}
		cmdInstall(os.Args[2])
	case "publish":
		cmdPublish()
	case "version", "--version", "-v":
		fmt.Printf("aurum v%s\n", config.Version)
	case "help", "--help", "-h":
		printUsage()
	default:
		fatalf("unknown command: %s\nRun 'aurum help' for usage.", os.Args[1])
	}
}

func cmdList() {
	idx, err := registry.FetchIndex(registryURL())
	if err != nil {
		fatalf("failed to fetch registry: %v", err)
	}
	if len(idx.Packages) == 0 {
		fmt.Println("No packages in registry.")
		return
	}
	fmt.Printf("%-28s %-10s %s\n", "PACKAGE", "VERSION", "DESCRIPTION")
	fmt.Printf("%-28s %-10s %s\n", "-------", "-------", "-----------")
	for _, p := range idx.Packages {
		fmt.Printf("%-28s %-10s %s\n", p.Name, p.Version, p.Description)
	}
}

func cmdInstall(name string) {
	idx, err := registry.FetchIndex(registryURL())
	if err != nil {
		fatalf("failed to fetch registry: %v", err)
	}
	pkg, ok := idx.Find(name)
	if !ok {
		fatalf("package %q not found in registry\nRun 'aurum list' to see available packages.", name)
	}
	ins := installer.New(config.DefaultInstallDir)
	if err := ins.Install(pkg); err != nil {
		fatalf("install failed: %v", err)
	}
}

func cmdPublish() {
	m, err := manifest.Load(".")
	if err != nil {
		fatalf("%v\nCreate an aurum.json in the current directory first.", err)
	}
	errs := manifest.Validate(m)
	if len(errs) > 0 {
		fmt.Fprintln(os.Stderr, "aurum.json has errors:")
		for _, e := range errs {
			fmt.Fprintf(os.Stderr, "  - %s\n", e)
		}
		os.Exit(1)
	}
	fmt.Printf("aurum.json is valid: %s@%s\n\n", m.Name, m.Version)
	fmt.Println("To publish to the Aurum registry:")
	fmt.Println("  1. Push your project to a public GitHub repository")
	fmt.Println("  2. Open a PR to https://github.com/walk4rever/aurum")
	fmt.Println("     adding your package to registry/index.json:")
	fmt.Printf(`
  {
    "name": %q,
    "version": %q,
    "description": %q,
    "author": %q,
    "source": "https://github.com/<your-org>/<your-repo>"
  }
`, m.Name, m.Version, m.Description, m.Author)
}

func registryURL() string {
	if url := os.Getenv("AURUM_REGISTRY"); url != "" {
		return url
	}
	return config.DefaultRegistryURL
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "error: "+format+"\n", args...)
	os.Exit(1)
}

func printUsage() {
	fmt.Printf(`aurum v%s — enterprise skill package manager

Usage:
  aurum list                list available packages in the registry
  aurum install <package>   install a skill package to ~/.claude/aurum/skills/
  aurum publish             validate aurum.json and show publish instructions
  aurum version             show version

Environment:
  AURUM_REGISTRY   override registry URL (supports local file paths for dev)

Examples:
  aurum list
  aurum install judge-the-code
  AURUM_REGISTRY=./registry/index.json aurum list
`, config.Version)
}
