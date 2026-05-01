import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect, useState, type FormEvent } from "react";

import { AppLayout } from "~/components/layout/AppLayout";
import { Avatar } from "~/components/ui/Avatar";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Input, Select, Textarea } from "~/components/ui/Field";
import { TagBadge } from "~/components/tags/TagBadge";
import { requireAuth } from "~/server/requireAuth";
import { type RouterOutputs, api } from "~/utils/api";
import { getErrorMessage } from "~/utils/format";

type ProjectRoleValue = "OWNER" | "ADMIN" | "MEMBER";
type Tag = RouterOutputs["tag"]["list"][number];

const tagColors = [
  "#64748b",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export default function ProjectSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = typeof router.query.id === "string" ? router.query.id : "";
  const utils = api.useUtils();

  const projectQuery = api.project.getById.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId) },
  );
  const tagsQuery = api.tag.list.useQuery(
    { projectId },
    { enabled: Boolean(projectId) },
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [memberError, setMemberError] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(tagColors[1] ?? "#0ea5e9");
  const [message, setMessage] = useState("");

  const project = projectQuery.data;
  const currentMembership = project?.members.find(
    (member) => member.user.id === session?.user.id,
  );
  const canManageProject =
    currentMembership?.role === "OWNER" || currentMembership?.role === "ADMIN";
  const canChangeRoles = currentMembership?.role === "OWNER";
  const canDeleteProject = currentMembership?.role === "OWNER";

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setDescription(project.description ?? "");
  }, [project]);

  const updateProject = api.project.update.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
      void utils.project.list.invalidate();
    },
  });
  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      void utils.project.list.invalidate();
    },
  });
  const addMember = api.project.addMember.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
    },
  });
  const removeMember = api.project.removeMember.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
    },
  });
  const updateMemberRole = api.project.updateMemberRole.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
    },
  });
  const createTag = api.tag.create.useMutation({
    onSuccess: () => {
      void utils.tag.list.invalidate({ projectId });
      void utils.task.list.invalidate();
    },
  });
  const updateTag = api.tag.update.useMutation({
    onSuccess: () => {
      void utils.tag.list.invalidate({ projectId });
      void utils.task.list.invalidate();
    },
  });
  const deleteTag = api.tag.delete.useMutation({
    onSuccess: () => {
      void utils.tag.list.invalidate({ projectId });
      void utils.task.list.invalidate();
    },
  });

  const handleUpdateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      const trimmedDescription = description.trim();
      await updateProject.mutateAsync({
        id: projectId,
        name: name.trim(),
        description: trimmedDescription === "" ? undefined : trimmedDescription,
      });
      setMessage("Project updated.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setMemberError("");

    try {
      await addMember.mutateAsync({
        projectId,
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail("");
      setMemberRole("MEMBER");
      setMessage("Member added.");
    } catch (error) {
      setMemberError(getErrorMessage(error));
    }
  };

  const handleCreateTag = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      await createTag.mutateAsync({
        projectId,
        name: newTagName.trim(),
        color: newTagColor,
      });
      setNewTagName("");
      setMessage("Tag created.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        "Delete this project and all of its tasks, tags, and members?",
      )
    )
      return;

    try {
      await deleteProject.mutateAsync({ id: projectId });
      void router.push("/projects");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleSaveTag = async (
    tagId: string,
    input: { name: string; color: string },
  ) => {
    setMessage("");

    try {
      await updateTag.mutateAsync({
        id: tagId,
        name: input.name,
        color: input.color,
      });
      setMessage("Tag updated.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setMessage("");

    try {
      await deleteTag.mutateAsync({ id: tagId });
      setMessage("Tag deleted.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <AppLayout title="Project settings" description="Manage project settings">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="text-sm font-medium text-slate-500 hover:text-slate-950"
            >
              Back to board
            </Link>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {project?.name ?? "Project settings"}
            </h2>
          </div>
          {canDeleteProject ? (
            <Button
              type="button"
              variant="danger"
              isLoading={deleteProject.isPending}
              onClick={handleDeleteProject}
            >
              Delete project
            </Button>
          ) : null}
        </div>

        {message ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">
            Project details
          </h3>
          <form onSubmit={handleUpdateProject} className="mt-5 space-y-4">
            <Input
              label="Name"
              value={name}
              disabled={!canManageProject}
              maxLength={100}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <Textarea
              label="Description"
              value={description}
              disabled={!canManageProject}
              maxLength={500}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
            {canManageProject ? (
              <div className="flex justify-end">
                <Button type="submit" isLoading={updateProject.isPending}>
                  Save details
                </Button>
              </div>
            ) : null}
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Members
              </h3>
              <p className="text-sm text-slate-500">
                Add users by email and manage project roles.
              </p>
            </div>
            <Badge>{project?.members.length ?? 0} members</Badge>
          </div>

          {canManageProject ? (
            <form
              onSubmit={handleAddMember}
              className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_auto]"
            >
              <Input
                label="Email"
                type="email"
                value={memberEmail}
                placeholder="teammate@example.com"
                error={memberError}
                onChange={(event) => {
                  setMemberEmail(event.currentTarget.value);
                  if (memberError) setMemberError("");
                }}
              />
              <Select
                label="Role"
                value={memberRole}
                onChange={(event) =>
                  setMemberRole(event.currentTarget.value as "ADMIN" | "MEMBER")
                }
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <div className="flex flex-col space-y-1.5">
                <span className="invisible text-sm font-medium">Add</span>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={addMember.isPending}
                >
                  Add
                </Button>
              </div>
            </form>
          ) : null}

          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {project?.members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <Avatar
                  name={member.user.name}
                  email={member.user.email}
                  image={member.user.image}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {member.user.name ?? member.user.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {member.user.email}
                  </p>
                </div>
                <RoleControl
                  role={member.role}
                  disabled={
                    !canChangeRoles ||
                    member.role === "OWNER" ||
                    member.user.id === session?.user.id ||
                    updateMemberRole.isPending
                  }
                  onChange={(role) =>
                    void updateMemberRole.mutateAsync({
                      projectId,
                      userId: member.user.id,
                      role,
                    })
                  }
                />
                {canManageProject && member.role !== "OWNER" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={removeMember.isPending}
                    onClick={() =>
                      void removeMember.mutateAsync({
                        projectId,
                        userId: member.user.id,
                      })
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-950">Tags</h3>
            <p className="text-sm text-slate-500">
              Project-scoped labels for filtering tasks.
            </p>
          </div>

          <form
            onSubmit={handleCreateTag}
            className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]"
          >
            <Input
              label="Tag name"
              value={newTagName}
              maxLength={50}
              disabled={!canManageProject}
              onChange={(event) => setNewTagName(event.currentTarget.value)}
            />
            <ColorPicker
              value={newTagColor}
              onChange={setNewTagColor}
              disabled={!canManageProject}
            />
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={!canManageProject}
                isLoading={createTag.isPending}
              >
                Create
              </Button>
            </div>
          </form>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tagsQuery.data?.map((tag) => (
              <TagEditorCard
                key={tag.id}
                tag={tag}
                disabled={!canManageProject}
                onSave={(input) => void handleSaveTag(tag.id, input)}
                onDelete={() => void handleDeleteTag(tag.id)}
              />
            ))}
          </div>

          {tagsQuery.data?.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              No tags yet.
            </p>
          ) : null}
        </section>
      </div>
    </AppLayout>
  );
}

function RoleControl({
  role,
  disabled,
  onChange,
}: {
  role: ProjectRoleValue;
  disabled: boolean;
  onChange: (role: "ADMIN" | "MEMBER") => void;
}) {
  if (role === "OWNER") {
    return (
      <Select aria-label="Role" value="OWNER" disabled className="w-36">
        <option value="OWNER">Owner</option>
      </Select>
    );
  }

  return (
    <Select
      aria-label="Role"
      value={role}
      disabled={disabled}
      className="w-36"
      onChange={(event) =>
        onChange(event.currentTarget.value as "ADMIN" | "MEMBER")
      }
    >
      <option value="MEMBER">Member</option>
      <option value="ADMIN">Admin</option>
    </Select>
  );
}

function ColorPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-slate-700">Color</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="h-10 w-12 rounded-md border border-slate-200 bg-white"
        />
        <div className="flex gap-1">
          {tagColors.map((color) => (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => onChange(color)}
              className="h-7 w-7 rounded-full border border-slate-200"
              style={{ backgroundColor: color }}
              aria-label={`Use ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TagEditorCard({
  tag,
  disabled,
  onSave,
  onDelete,
}: {
  tag: Tag;
  disabled: boolean;
  onSave: (input: { name: string; color: string }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  useEffect(() => {
    setName(tag.name);
    setColor(tag.color);
  }, [tag]);

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-slate-200 p-4 shadow-sm transition-shadow hover:shadow-md">
      <Input
        label="Name"
        value={name}
        maxLength={50}
        disabled={disabled}
        onChange={(event) => setName(event.currentTarget.value)}
      />

      <ColorPicker value={color} onChange={setColor} disabled={disabled} />

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Preview
          </p>
          <TagBadge name={name === "" ? tag.name : name} color={color} />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSave({ name: name.trim(), color })}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={disabled}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = requireAuth;
