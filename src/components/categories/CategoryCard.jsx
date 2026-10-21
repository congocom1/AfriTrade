import React from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';

export default function CategoryCard({ image, title, text }) {
  return (
    <Link
      to="/categories"
      className="group overflow-hidden rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Image
        src={`/images/${image}.svg`}
        alt={title}
        width={1000}
        height={1000}
        loading="lazy"
        decoding="async"
        className="aspect-square w-full object-cover"
      />
      <div className="flex items-center justify-between gap-4 p-5 md:p-6">
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold tracking-tight group-hover:text-primary">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    </Link>
  );
}
