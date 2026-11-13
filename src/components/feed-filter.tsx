'use client';

import Link from 'next/link';
import {
  CheckIcon,
  ClockIcon,
  CodeIcon,
  CoffeeIcon,
  HeartIcon,
  LayoutGridIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  StarIcon,
  TrendingUpIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** One menu row. Built on the server (hrefs, labels, counts) so this file stays free of DB code. */
export type FilterOption = {
  value: string;
  label: string;
  href: string;
  count?: number;
  isActive: boolean;
};

const OPTION_ICONS: Record<string, LucideIcon> = {
  all: LayoutGridIcon,
  trading: TrendingUpIcon,
  coding: CodeIcon,
  life: CoffeeIcon,
  newest: ClockIcon,
  liked: HeartIcon,
  rated: StarIcon,
};

function OptionItem({ option }: { option: FilterOption }) {
  const Icon = OPTION_ICONS[option.value] ?? LayoutGridIcon;
  return (
    <DropdownMenuItem
      render={<Link href={option.href} />}
      aria-current={option.isActive ? 'page' : undefined}
      className={option.isActive ? 'text-primary' : undefined}
    >
      <Icon aria-hidden />
      {option.label}
      <span className="ml-auto flex items-center gap-2">
        {option.count !== undefined && (
          <span className="font-mono text-xs text-muted-foreground">{option.count}</span>
        )}
        <CheckIcon aria-hidden className={option.isActive ? 'text-primary' : 'invisible'} />
      </span>
    </DropdownMenuItem>
  );
}

/** Topic + sort in one "Filter" button. Every choice is a plain link, so URLs stay shareable. */
export function FeedFilter({
  topicOptions,
  sortOptions,
  resetHref,
}: {
  topicOptions: FilterOption[];
  sortOptions: FilterOption[];
  resetHref: string;
}) {
  const activeTopic = topicOptions.find((option) => option.isActive && option.value !== 'all');
  const activeSort = sortOptions.find((option) => option.isActive && option.value !== 'newest');
  const activeLabels = [activeTopic?.label, activeSort?.label].filter(Boolean);
  const isFiltered = activeLabels.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-8 items-center gap-2 rounded-[10px] bg-glass px-3 text-sm text-muted-foreground shadow-[inset_0_1px_0_var(--glass-edge)] transition-colors outline-none hover:bg-glass-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-glass-hover data-popup-open:text-foreground">
        <SlidersHorizontalIcon className="size-4" aria-hidden />
        Filter
        {isFiltered && (
          <>
            <span className="text-foreground">· {activeLabels.join(' · ')}</span>
            <span
              className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary"
              aria-hidden
            />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Topic</DropdownMenuLabel>
          {topicOptions.map((option) => (
            <OptionItem key={option.value} option={option} />
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort</DropdownMenuLabel>
          {sortOptions.map((option) => (
            <OptionItem key={option.value} option={option} />
          ))}
        </DropdownMenuGroup>
        {isFiltered && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={resetHref} />}>
              <RotateCcwIcon aria-hidden />
              Reset
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
