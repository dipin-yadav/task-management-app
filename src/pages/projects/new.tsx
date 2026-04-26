import { useState } from "react";
import { useRouter } from "next/router";

import { AppLayout } from "~/components/layout/AppLayout";
import { Button, ButtonLink } from "~/components/ui/Button";
import { Input, Textarea } from "~/components/ui/Field";
import { requireAuth } from "~/server/requireAuth";
import { api } from "~/utils/api";
import { getErrorMessage } from "~/utils/format";

export default function NewProjectPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      void utils.project.list.invalidate();
    },
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    try {
      const trimmedDescription = description.trim();
      const project = await createProject.mutateAsync({
        name: trimmedName,
        description: trimmedDescription === "" ? undefined : trimmedDescription,
      });
      void router.push(`/projects/${project.id}`);
    } catch (mutationError) {
      setError(getErrorMessage(mutationError));
    }
  };

  return (
    <AppLayout title="New project" description="Create a new project">
      <div className="mx-auto max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Create project</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add the workspace details now. Members, tags, and tasks can be managed next.
            </p>
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <Input
            label="Project name"
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <Textarea
            label="Description"
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <ButtonLink href="/projects" variant="outline">
              Cancel
            </ButtonLink>
            <Button type="submit" isLoading={createProject.isPending}>
              Create project
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export const getServerSideProps = requireAuth;
