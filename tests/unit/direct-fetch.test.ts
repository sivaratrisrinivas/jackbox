import { describe, expect, it, vi } from "vitest";
import { loadPublicPagesWithFetch } from "@/lib/firecrawl/direct-fetch";

function textResponse(body: string, contentType = "text/html") {
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
    },
  });
}

describe("direct public fetch fallback", () => {
  it("extracts title, metadata, headings, lists, and paragraphs from public HTML", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      textResponse(`
        <html>
          <head>
            <title>Pricing | Acme</title>
            <meta name="description" content="Plans for growing teams">
            <style>.hidden { display: none; }</style>
          </head>
          <body>
            <nav>Docs Pricing Blog</nav>
            <h1>Pricing built for support teams</h1>
            <p>Acme packages support automation by workspace volume.</p>
            <ul>
              <li>Starter plan for small teams</li>
              <li>Enterprise plan with controls</li>
            </ul>
            <script>window.secret = true</script>
          </body>
        </html>
      `),
    );

    const fixture = await loadPublicPagesWithFetch({
      companyUrl: "https://acme.example.com",
      urls: ["https://acme.example.com/pricing"],
      fetchImpl: fetchMock,
    });

    expect(fixture?.pages[0]).toMatchObject({
      title: "Pricing | Acme",
      pageType: "pricing",
    });
    expect(fixture?.pages[0]?.markdown).toContain("Plans for growing teams");
    expect(fixture?.pages[0]?.markdown).toContain("Pricing built for support teams");
    expect(fixture?.pages[0]?.markdown).toContain("Starter plan for small teams");
    expect(fixture?.pages[0]?.markdown).not.toContain("window.secret");
  });

  it("skips non-text responses and off-origin URLs", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      textResponse("binary", "application/octet-stream"),
    );

    const fixture = await loadPublicPagesWithFetch({
      companyUrl: "https://acme.example.com",
      urls: ["https://acme.example.com/file.zip", "https://other.example.com/pricing"],
      fetchImpl: fetchMock,
    });

    expect(fixture).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
