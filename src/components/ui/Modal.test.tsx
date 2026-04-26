import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Modal } from "~/components/ui/Modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    const markup = renderToStaticMarkup(
      <Modal open={false} title="Delete task" onClose={() => undefined}>
        Body
      </Modal>
    );

    expect(markup).toBe("");
  });

  it("renders dialog semantics with a labelled title", () => {
    const markup = renderToStaticMarkup(
      <Modal open={true} title="Delete task" onClose={() => undefined}>
        Body
      </Modal>
    );
    const labelMatch = /aria-labelledby="([^"]+)"/.exec(markup);

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(labelMatch?.[1]).toBeTruthy();
    expect(markup).toContain(`id="${labelMatch?.[1] ?? ""}"`);
  });
});
