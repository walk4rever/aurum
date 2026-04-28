package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Message struct {
	ID         string    `json:"id"`
	FromAddr   string    `json:"from_addr"`
	Subject    string    `json:"subject"`
	BodyText   string    `json:"body_text"`
	BodyHTML   string    `json:"body_html"`
	ReceivedAt time.Time `json:"received_at"`
}

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

func fetchInbox(cfg *Config, since *time.Time, limit int) ([]Message, error) {
	u, err := url.Parse(cfg.APIURL + "/agents/" + cfg.localPart() + "/messages")
	if err != nil {
		return nil, fmt.Errorf("invalid API URL: %w", err)
	}

	q := u.Query()
	q.Set("limit", fmt.Sprintf("%d", limit))
	if since != nil {
		q.Set("since", since.UTC().Format(time.RFC3339))
	}
	u.RawQuery = q.Encode()

	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 8<<10))
		return nil, fmt.Errorf("API error: %s (%s)", resp.Status, strings.TrimSpace(string(body)))
	}

	var result struct {
		OK       bool      `json:"ok"`
		Messages []Message `json:"messages"`
		Error    string    `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode failed: %w", err)
	}
	if !result.OK {
		return nil, fmt.Errorf("API error: %s", result.Error)
	}
	return result.Messages, nil
}

func sendMessage(cfg *Config, to, subject, body string) (string, error) {
	payload := map[string]string{
		"to":      to,
		"subject": subject,
		"text":    body,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, cfg.APIURL+"/agents/send", bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 8<<10))
		return "", fmt.Errorf("API error: %s (%s)", resp.Status, strings.TrimSpace(string(body)))
	}

	var result struct {
		OK    bool   `json:"ok"`
		From  string `json:"from"`
		Error string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode failed: %w", err)
	}
	if !result.OK {
		return "", fmt.Errorf("API error: %s", result.Error)
	}
	return result.From, nil
}
