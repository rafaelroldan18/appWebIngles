interface IconProps {
  name: string;
  className?: string;
}

export default function Icon({ name, className = "w-6 h-6" }: IconProps) {
  return (
    // @ts-expect-error - ion-icon is a web component
    <ion-icon 
      name={name} 
      class={className}
      style={{ fontSize: '1.5rem' }}
    />
  );
}