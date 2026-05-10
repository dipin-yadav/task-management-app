import { formatDateTime } from "~/utils/format";
import { type Activity, type User, type Task } from "@prisma/client";
import { Avatar } from "~/components/ui/Avatar";

interface HistoryTimelineProps {
  activities: (Activity & {
    user: Pick<User, "id" | "name" | "image"> | null;
    task?: Pick<Task, "id" | "title"> | null;
  })[];
}

export function HistoryTimeline({ activities }: HistoryTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-slate-500">No history events yet.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <Avatar
                    image={activity.user?.image ?? null}
                    name={activity.user?.name ?? "User"}
                    size="sm"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">
                        {activity.user?.name ?? "Unknown User"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    <p>{activity.message}</p>
                    {activity.task && (
                      <p className="mt-1 text-xs font-medium text-indigo-600">
                        Task: {activity.task.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
