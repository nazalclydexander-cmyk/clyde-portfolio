import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return <Icon {...props}><path d="M7 17 17 7M7 7h10v10" /></Icon>;
}

export function GithubIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.22c-3.22.7-3.9-1.36-3.9-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.15c.98 0 1.95.13 2.87.39 2.2-1.5 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04a4.43 4.43 0 0 1 1.18 3.08c0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.07.79 2.16v3.23c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
}

export function CloseIcon(props: IconProps) {
  return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
}

export function GridIcon(props: IconProps) {
  return <Icon {...props}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></Icon>;
}

export function FolderIcon(props: IconProps) {
  return <Icon {...props}><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" /></Icon>;
}

export function ToolIcon(props: IconProps) {
  return <Icon {...props}><path d="m14.7 6.3 3-3a5 5 0 0 1-6.3 6.3L5.5 15.5a2.1 2.1 0 0 0 3 3l5.9-5.9a5 5 0 0 0 6.3-6.3l-3 3Z" /></Icon>;
}

export function MailIcon(props: IconProps) {
  return <Icon {...props}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Icon>;
}

export function ExternalLinkIcon(props: IconProps) {
  return <Icon {...props}><path d="M14 5h5v5M19 5l-8 8" /><path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" /></Icon>;
}

export function LogOutIcon(props: IconProps) {
  return <Icon {...props}><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M9 12h9" /></Icon>;
}

export function PlusIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function CheckIcon(props: IconProps) {
  return <Icon {...props}><path d="m5 12 4 4L19 6" /></Icon>;
}

export function TrashIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></Icon>;
}

export function EditIcon(props: IconProps) {
  return <Icon {...props}><path d="m4 16-.5 4.5L8 20l11-11-4-4Z" /><path d="m13.5 6.5 4 4" /></Icon>;
}

export function UploadIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></Icon>;
}

export function ProfileIcon(props: IconProps) {
  return <Icon {...props}><rect x="4" y="3.5" width="16" height="17" rx="2" /><circle cx="12" cy="9" r="2.5" /><path d="M7.5 17c1.5-2 3-3 4.5-3s3 .9 4.5 3" /></Icon>;
}
