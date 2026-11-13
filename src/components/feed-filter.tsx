'use client';

import Link from 'next/link';
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CodeIcon,
  CoffeeIcon,
  HeartIcon,
  LayoutGridIcon,
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

/** One dropdown button (Topic or Sort). Every choice is a plain link, so URLs stay shareable. */
export function FilterMenu({
  name,
  icon: ButtonIcon,
  options,
  defaultValue,
  align = 'start',
}: {
  name: string;
  icon: LucideIcon;
  options: FilterOption[];
  defaultValue: string;
  align?: 'start' | 'end';
}) {
  const activeOption = options.find((option) => option.isActive);
  const isChanged = activeOption !== undefined && activeOption.value !== defaultValue;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${name}: ${activeOption?.label ?? ''}`}
        className="relative flex h-8 items-center gap-2 rounded-[10px] bg-glass px-3 text-sm text-muted-foreground shadow-[inset_0_1px_0_var(--glass-edge)] transition-colors outline-none hover:bg-glass-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-glass-hover data-popup-open:text-foreground"
      >
        <ButtonIcon className="size-4" aria-hidden />
        {name}
        {activeOption && <span className="text-foreground">{activeOption.label}</span>}
        <ChevronDownIcon className="size-3.5" aria-hidden />
        {isChanged && (
          <span
            className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary"
            aria-hidden
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          {options.map((option) => (
            <OptionItem key={option.value} option={option} />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
