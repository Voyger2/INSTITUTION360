"use client";

import * as React from "react";
import { useDemoState } from "@/lib/demo-state-context";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";

const REGIONS = [
  { code: "NW", name: "North Western" },
  { code: "SW", name: "South Western" },
  { code: "SC", name: "South Central" },
  { code: "NC", name: "North Central" },
  { code: "C", name: "Central" },
  { code: "W", name: "Western" },
  { code: "NE", name: "North Eastern" },
  { code: "E", name: "Eastern" },
  { code: "N", name: "Northern" },
  { code: "S", name: "Southern" },
];

export function InstitutionsPage() {
  const { institutions } = useDemoState();
  const [search, setSearch] = React.useState("");
  const [aicteIdSearch, setAicteIdSearch] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filtered = institutions.filter((inst) => {
    const matchesSearch = inst.name.toLowerCase().includes(search.toLowerCase());
    const matchesAicte = inst.aictePermanentId.toLowerCase().includes(aicteIdSearch.toLowerCase());
    const matchesRegion = !regionFilter || inst.region === regionFilter;
    return matchesSearch && matchesAicte && matchesRegion;
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-ink-muted mb-1">Institution Name</label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by institution name..."
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-ink-muted mb-1">AICTE Permanent ID</label>
            <Input
              value={aicteIdSearch}
              onChange={(e) => {
                setAicteIdSearch(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. AICTE-PERM-1001"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-ink-muted mb-1">Region</label>
            <Select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setPage(1);
              }}
              options={REGIONS.map((r) => ({ value: r.code, label: r.name }))}
            />
          </div>
          <div className="flex flex-col h-[78px]">
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setAicteIdSearch("");
                setRegionFilter("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <Table
          columns={[
            { key: "name", label: "Institution Name", sortable: true },
            { key: "aictePermanentId", label: "AICTE Permanent ID", sortable: true },
            { key: "region", label: "Region", sortable: true },
            { key: "state", label: "State", sortable: true },
            { key: "type", label: "Type", sortable: true },
            { key: "action", label: "Action", sortable: false },
          ]}
          data={paginated.map((inst) => ({
            ...inst,
            action: <Link href={`/institutions/${inst.id}`} className="text-primary font-medium hover:underline">View Details</Link>,
          }))}
          rowKey="id"
        />
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />

      <div className="mt-4 text-xs text-ink-muted">
        <p>All records are synthetic demonstration data. This is not connected to AICTE internal systems.</p>
      </div>
    </div>
  );
}

export default InstitutionsPage;