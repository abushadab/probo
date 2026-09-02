// Copyright (c) 2026 Probo Inc <hello@probo.com>.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

package prosemirror

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateDocumentContentJSON_Schema(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		in      string
		wantErr bool
	}{
		{name: "empty", in: "", wantErr: false},
		{name: "whitespace only", in: "   \n", wantErr: false},
		{
			name:    "valid paragraph",
			in:      `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"hi"}]}]}`,
			wantErr: false,
		},
		{name: "plain text", in: "not json", wantErr: true},
		{name: "non-doc root", in: `{"type":"paragraph","content":[]}`, wantErr: true},
		{name: "unknown node", in: `{"type":"doc","content":[{"type":"unknownWidget"}]}`, wantErr: true},
		{
			name:    "unknown mark",
			in:      `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"glow"}],"text":"hi"}]}]}`,
			wantErr: true,
		},
		{
			name:    "invalid heading level",
			in:      `{"type":"doc","content":[{"type":"heading","attrs":{"level":9},"content":[{"type":"text","text":"hi"}]}]}`,
			wantErr: true,
		},
		{
			name:    "list item at root",
			in:      `{"type":"doc","content":[{"type":"listItem","content":[{"type":"paragraph"}]}]}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := ValidateDocumentContentJSON(tt.in)
			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
		})
	}
}

func TestSanitizeDocumentJSON_EmptyUnchanged(t *testing.T) {
	t.Parallel()

	got, err := SanitizeDocumentJSON("")
	require.NoError(t, err)
	assert.Equal(t, "", got)

	got, err = SanitizeDocumentJSON("   ")
	require.NoError(t, err)
	assert.Equal(t, "   ", got)
}

func TestSanitizeDocumentJSON_NonJSONError(t *testing.T) {
	t.Parallel()

	_, err := SanitizeDocumentJSON("plain text is not valid document JSON")
	require.Error(t, err)
}

func TestSanitizeDocumentJSON_NonDocRootError(t *testing.T) {
	t.Parallel()

	_, err := SanitizeDocumentJSON(`{"type":"paragraph","content":[]}`)
	require.Error(t, err)
}

func TestSanitizeDocumentJSON_LinkHref(t *testing.T) {
	t.Parallel()

	raw := `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)","target":"_blank"}}],"text":"click"}]}]}`

	out, err := SanitizeDocumentJSON(raw)
	require.NoError(t, err)

	var doc Node
	require.NoError(t, json.Unmarshal([]byte(out), &doc))
	txt := doc.Content[0].Content[0]
	require.Len(t, txt.Marks, 1)
	attrs, err := txt.Marks[0].LinkAttrs()
	require.NoError(t, err)
	assert.Equal(t, "#", attrs.Href)
	require.NotNil(t, attrs.Target)
	assert.Equal(t, "_blank", *attrs.Target)
}

func TestSanitizeDocumentJSON_PreservesSafeHref(t *testing.T) {
	t.Parallel()

	raw := `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"link","attrs":{"href":"https://example.com"}}],"text":"ok"}]}]}`

	out, err := SanitizeDocumentJSON(raw)
	require.NoError(t, err)

	var doc Node
	require.NoError(t, json.Unmarshal([]byte(out), &doc))
	txt := doc.Content[0].Content[0]
	attrs, err := txt.Marks[0].LinkAttrs()
	require.NoError(t, err)
	assert.Equal(t, "https://example.com", attrs.Href)
}

func TestSanitizeDocumentJSON_ImageSrc(t *testing.T) {
	t.Parallel()

	raw := `{"type":"doc","content":[{"type":"image","attrs":{"src":"javascript:alert(1)","alt":"xss"}}]}`

	out, err := SanitizeDocumentJSON(raw)
	require.NoError(t, err)

	var doc Node
	require.NoError(t, json.Unmarshal([]byte(out), &doc))
	img := doc.Content[0]
	attrs, err := img.ImageAttrs()
	require.NoError(t, err)
	assert.Equal(t, "", attrs.Src)
	require.NotNil(t, attrs.Alt)
	assert.Equal(t, "xss", *attrs.Alt)
}

func TestSanitizeDocumentJSON_PreservesSafeImageSrc(t *testing.T) {
	t.Parallel()

	raw := `{"type":"doc","content":[{"type":"image","attrs":{"src":"https://example.com/img.png","alt":"ok"}}]}`

	out, err := SanitizeDocumentJSON(raw)
	require.NoError(t, err)

	var doc Node
	require.NoError(t, json.Unmarshal([]byte(out), &doc))
	img := doc.Content[0]
	attrs, err := img.ImageAttrs()
	require.NoError(t, err)
	assert.Equal(t, "https://example.com/img.png", attrs.Src)
}
