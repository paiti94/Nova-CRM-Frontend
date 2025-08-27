import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useAuth0 } from '@auth0/auth0-react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';

type Option = { label: string; value: string; email?: string };

export function ClientSelector({
  selectedClientId,
  onClientSelect,
  label = 'Select Client',
}: {
  selectedClientId: string | null;
  onClientSelect: (clientId: string | null) => void;
  label?: string;
}) {
  const { getAuthToken } = useAuthenticatedApi();
  const { isAuthenticated } = useAuth0();

  const { data: options = [], isLoading } = useQuery<Option[]>({
    queryKey: ['users', 'as-options'],  // << unique key OR keep same key but use `select`
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/users');
      return (Array.isArray(data) ? data : [])
        .map((c: any) => {
          const id = (c.id ?? c._id)?.toString();
          if (!id) return null;
          return { label: c.name?.trim() || 'Unnamed', value: id, email: c.email };
        })
        .filter(Boolean) as Option[];
    },
    enabled: isAuthenticated,
  });
  // IMPORTANT: only null means “no selection”
  const value = selectedClientId ?? null;

  const onChange = (e: DropdownChangeEvent) => {
    // e.value will be either a string (the optionValue) or null when cleared
    const next = (e.value ?? null) as string | null;
    onClientSelect(next); // never pass ''
  };

  const initials = (label?: string) =>
    (label ?? '?')
      .split(' ')
      .filter(Boolean)
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const itemTemplate = (opt: Option) => (
    <div className="flex items-center gap-3 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-sm font-semibold">
        {initials(opt.label)}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{opt.label}</span>
        {opt.email && <span className="text-xs text-gray-500">{opt.email}</span>}
      </div>
    </div>
  );

  const valueTemplate = (opt: Option | null) =>
    opt ? (
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
          {initials(opt.label)}
        </span>
        <span className="text-sm text-gray-900">{opt.label}</span>
      </div>
    ) : (
      <span className="text-gray-400">Select a client</span>
    );

  return (
    <div className="mb-8">
      <div className="group relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 group-hover:ring-black/10" />
        <label className="relative mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
          <span className="inline-flex size-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <i className="pi pi-users text-[12px]" />
          </span>
          {label}
        </label>

        <Dropdown
          value={value}                 // string | null
          onChange={onChange}
          options={options}
          optionLabel="label"
          optionValue="value"           // << primitive mode
          placeholder="Select a client"
          filter
          filterBy="label,email"
          showClear
          className="w-full"
          itemTemplate={itemTemplate}
          valueTemplate={valueTemplate}
          appendTo={document.body}      // keeps panel above OverlayPanel
          panelStyle={{ zIndex: 6000 }}
          loading={isLoading}
        />

        <p className="mt-2 text-xs text-gray-500">Type to search, or clear to view all tasks.</p>
      </div>
    </div>
  );
}
