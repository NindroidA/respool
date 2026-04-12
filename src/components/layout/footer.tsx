import Image from "next/image";
import { NINDROID_PROJECTS, FOOTER_LINKS } from "@/lib/constants";
import { ExternalLink } from "lucide-react";

const appVersion = process.env.APP_VERSION ?? "0.0.0";

export function Footer() {
  return (
    <footer className="border-t border-border bg-(--bg-raised)">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1 — Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Respool" width={24} height={24} />
              <span className="text-base font-semibold tracking-tight text-foreground">
                Respool
              </span>
            </div>
            <p className="text-sm leading-relaxed text-(--text-muted)">
              Self-hosted 3D printing filament management.
            </p>
            <p className="text-sm font-medium text-jade">
              A Nindroid Systems Project
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a
                href={FOOTER_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) transition-colors hover:text-jade"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={FOOTER_LINKS.coffee}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) transition-colors hover:text-jade"
              >
                Buy Me a Coffee
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Column 2 — Projects */}
          <div>
            <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
              Projects
            </p>
            <ul className="space-y-2">
              {NINDROID_PROJECTS.map((project) => (
                <li key={project.name}>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) transition-colors hover:text-jade"
                  >
                    {project.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Resources */}
          <div>
            <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
              Resources
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href={FOOTER_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) transition-colors hover:text-jade"
                >
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href={FOOTER_LINKS.contributing}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) transition-colors hover:text-jade"
                >
                  Contributing
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href={FOOTER_LINKS.issues}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) transition-colors hover:text-jade"
                >
                  Report an Issue
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-(--text-faint)">
            &copy; {new Date().getFullYear()} Nindroid Systems
          </p>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-(--accent-jade-muted) px-2.5 py-0.5 font-mono text-xs font-medium text-jade">
              v{appVersion}
            </span>
            <a
              href={FOOTER_LINKS.license}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-(--text-faint) transition-colors hover:text-jade"
            >
              MIT License
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
