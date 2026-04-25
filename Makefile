.PHONY: build install test clean

build:
	go build -o bin/aurum ./cmd/aurum

install: build
	cp bin/aurum /usr/local/bin/aurum

test:
	AURUM_REGISTRY=./registry/index.json go run ./cmd/aurum list

clean:
	rm -rf bin/
