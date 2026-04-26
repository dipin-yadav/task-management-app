import { useEffect, useState, type FormEvent } from "react";

import { AppLayout } from "~/components/layout/AppLayout";
import { Avatar } from "~/components/ui/Avatar";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Field";
import { requireAuth } from "~/server/requireAuth";
import { api } from "~/utils/api";
import { formatDateTime, getErrorMessage } from "~/utils/format";

export default function ProfilePage() {
  const utils = api.useUtils();
  const profileQuery = api.auth.getProfile.useQuery();
  const updateProfile = api.auth.updateProfile.useMutation({
    onSuccess: () => {
      void utils.auth.getProfile.invalidate();
    },
  });

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profileQuery.data) return;
    setName(profileQuery.data.name ?? "");
    setImage(profileQuery.data.image ?? "");
  }, [profileQuery.data]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const trimmedName = name.trim();
    const trimmedImage = image.trim();

    try {
      await updateProfile.mutateAsync({
        name: trimmedName === "" ? undefined : trimmedName,
        image: trimmedImage === "" ? undefined : trimmedImage,
      });
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <AppLayout title="Profile" description="Manage your account profile">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <Avatar
              size="lg"
              name={profileQuery.data?.name}
              email={profileQuery.data?.email}
              image={profileQuery.data?.image}
            />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {profileQuery.data?.name ?? "Your profile"}
              </h2>
              <p className="text-sm text-slate-500">{profileQuery.data?.email}</p>
            </div>
          </div>

          {message ? (
            <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <Input label="Email" value={profileQuery.data?.email ?? ""} readOnly disabled />
            <Input
              label="Image URL"
              type="url"
              value={image}
              placeholder="https://example.com/avatar.png"
              hint="Leave blank to keep your current image unchanged."
              onChange={(event) => setImage(event.currentTarget.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={updateProfile.isPending}>
                Save profile
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Account details</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Created</dt>
              <dd className="font-medium text-slate-800">
                {formatDateTime(profileQuery.data?.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Last updated</dt>
              <dd className="font-medium text-slate-800">
                {formatDateTime(profileQuery.data?.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </AppLayout>
  );
}

export const getServerSideProps = requireAuth;
