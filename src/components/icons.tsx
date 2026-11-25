import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  )
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1={4} y1={7} x2={20} y2={7} />
      <line x1={4} y1={12} x2={20} y2={12} />
      <line x1={4} y1={17} x2={20} y2={17} />
    </Icon>
  )
}

export function BackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M15 5 8 12l7 7" />
    </Icon>
  )
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  )
}

export function HouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </Icon>
  )
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={8.2} />
      <path d="M12 7.5V12l3.2 2" />
    </Icon>
  )
}

export function PersonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={8.3} r={3.6} />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </Icon>
  )
}

export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={9} cy={8.5} r={3} />
      <path d="M3 19c1.1-3 3.3-4.6 6-4.6s4.9 1.6 6 4.6" />
      <circle cx={17} cy={9} r={2.4} />
      <path d="M15.3 14.6c2.3.2 4 1.7 4.9 4.4" />
    </Icon>
  )
}

export function CardsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x={4} y={5} width={11} height={15} rx={1.5} transform="rotate(-8 4 5)" />
      <rect x={9.5} y={4} width={11} height={15} rx={1.5} transform="rotate(8 9.5 4)" />
    </Icon>
  )
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={10.5} cy={10.5} r={6.5} />
      <line x1={15.3} y1={15.3} x2={20} y2={20} />
    </Icon>
  )
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 20l1-4.3L15.3 5.4a1.5 1.5 0 0 1 2.1 0l1.2 1.2a1.5 1.5 0 0 1 0 2.1L8.3 19 4 20Z" />
    </Icon>
  )
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1={5} y1={19} x2={5} y2={11} />
      <line x1={12} y1={19} x2={12} y2={6} />
      <line x1={19} y1={19} x2={19} y2={14} />
    </Icon>
  )
}

export function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10" />
      <path d="M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" />
      <line x1={12} y1={13.5} x2={12} y2={17} />
      <line x1={9} y1={20} x2={15} y2={20} />
      <line x1={9.5} y1={20} x2={10.5} y2={17} />
      <line x1={14.5} y1={20} x2={13.5} y2={17} />
    </Icon>
  )
}

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={3} />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.9l1.6 1.6M17.5 15.5l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.1l1.6-1.6M17.5 8.5l1.6-1.6" />
    </Icon>
  )
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" />
      <path d="M15 16l4-4-4-4" />
      <line x1={19} y1={12} x2={9} y2={12} />
    </Icon>
  )
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <line x1={12} y1={5} x2={12} y2={19} />
      <line x1={5} y1={12} x2={19} y2={12} />
    </Icon>
  )
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 15V4M12 4 8 8M12 4l4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </Icon>
  )
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6l-7-2.5Z" />
      <path d="M9.3 12.2 11.3 14l3.6-4" />
    </Icon>
  )
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx={12} cy={12} r={2.5} />
    </Icon>
  )
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.5-6.5 10-6.5c1.6 0 3 .3 4.2.8M22 12s-1 1.9-2.9 3.6M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" />
      <path d="M6.1 6.1C3.6 7.8 2 12 2 12s3.5 6.5 10 6.5c1.9 0 3.5-.5 4.8-1.2" />
      <line x1={3} y1={3} x2={21} y2={21} />
    </Icon>
  )
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x={4} y={5} width={16} height={15} rx={2} />
      <line x1={4} y1={10} x2={20} y2={10} />
      <line x1={8} y1={3} x2={8} y2={7} />
      <line x1={16} y1={3} x2={16} y2={7} />
    </Icon>
  )
}

export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 0 1 14.5-4.6" />
      <path d="M20 12a8 8 0 0 1-14.5 4.6" />
      <path d="M18.5 3v4.6h-4.6" />
      <path d="M5.5 21v-4.6h4.6" />
    </Icon>
  )
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 5h16v11H9l-4 4v-4H4Z" />
      <line x1={8} y1={9} x2={16} y2={9} />
      <line x1={8} y1={12.5} x2={13} y2={12.5} />
    </Icon>
  )
}

export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8.5 14.5a2.5 2.5 0 0 0 5 0c0-1.4-.9-2.4-1.5-3.5-.7-1.3-.3-2.8 1-4 .3 1.6 1.2 3 2.5 4 1.3 1 2 2.3 2 3.7a5 5 0 1 1-10 0c0-1.1.4-2 1-2.6" />
    </Icon>
  )
}

export function CrownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5Z" />
      <line x1={5} y1={19} x2={19} y2={19} />
    </Icon>
  )
}
