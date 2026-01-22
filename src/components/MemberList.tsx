"use client";

import { useState } from "react";
import { useI18n } from "@/components/LocaleProvider";
import RemoveMemberButton from "@/components/RemoveMemberButton";

type Member = {
  role: "MANAGER" | "MEMBER";
  users: {
    id: string;
    name: string | null;
    email: string | null;
    image_url: string | null;
  } | null;
};

export default function MemberList({
  orgId,
  members,
  isManager,
}: {
  orgId: string;
  members: Member[];
  isManager: boolean;
}) {
  const { dictionary } = useI18n();
  const [showAllMembers, setShowAllMembers] = useState(false);

  const managers = members.filter((member) => member.role === "MANAGER");
  const regularMembers = members.filter((member) => member.role !== "MANAGER");
  const visibleMembers = showAllMembers
    ? regularMembers
    : regularMembers.slice(0, 5);
  const hasMoreMembers = regularMembers.length > 5;

  return (
    <div className="space-y-4 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {dictionary.dashboard.roleManager}
        </p>
        {managers.map((member) => (
          <div
            key={member.users?.id}
            className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {member.users?.name ??
                  member.users?.email ??
                  dictionary.dashboard.roleMember}
              </p>
              <p className="text-xs text-slate-500">{member.users?.email}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              {dictionary.dashboard.roleManager}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {dictionary.dashboard.roleMember}
        </p>
        {visibleMembers.map((member) => (
          <div
            key={member.users?.id}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {member.users?.name ??
                  member.users?.email ??
                  dictionary.dashboard.roleMember}
              </p>
              <p className="text-xs text-slate-500">{member.users?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {dictionary.dashboard.roleMember}
              </span>
              {isManager ? (
                <RemoveMemberButton
                  orgId={orgId}
                  userId={member.users?.id ?? ""}
                />
              ) : null}
            </div>
          </div>
        ))}
        {hasMoreMembers ? (
          <button
            type="button"
            onClick={() => setShowAllMembers((prev) => !prev)}
            className="text-xs font-semibold text-slate-700 underline"
          >
            {showAllMembers
              ? dictionary.event.listShowLess
              : dictionary.event.listShowMore}
          </button>
        ) : null}
      </div>
    </div>
  );
}
