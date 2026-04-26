import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "~/components/ui/Button";

describe("Button", () => {
  it("defaults to a non-submit button", () => {
    const markup = renderToStaticMarkup(<Button>Save</Button>);

    expect(markup).toContain('type="button"');
  });

  it("allows submit buttons and exposes loading state", () => {
    const markup = renderToStaticMarkup(
      <Button type="submit" isLoading={true}>Save</Button>
    );

    expect(markup).toContain('type="submit"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("disabled");
  });
});
