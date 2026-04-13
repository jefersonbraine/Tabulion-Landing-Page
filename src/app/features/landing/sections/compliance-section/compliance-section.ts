import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Badge = {
  // Ícone a exibir (nome do Material Symbol).
  icon: string;
  // Título principal do badge.
  label: string;
  // Descrição do badge.
  sub: string;
};

type AuditLog = {
  // Timestamp da ação (HH:MM:SS).
  ts: string;
  // Tipo de ação (OCR_CLASSIFY, FILE_RENAME, etc).
  action: string;
  // Alvo da ação (arquivo, sessão, ID).
  target: string;
  // Status da operação (OK, FAIL, PENDING).
  status: string;
};

@Component({
  selector: 'app-compliance-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './compliance-section.html',
  styleUrl: './compliance-section.css',
})
export class ComplianceSection implements AfterViewInit {
  // Referencia de destroy para limpar observers.
  private readonly referenciaDestruicao = inject(DestroyRef);
  // Identificador de plataforma para evitar APIs de browser no SSR.
  private readonly idPlataforma = inject(PLATFORM_ID);

  // Bloco do cabecalho (titulo e paragrafos).
  readonly cabecalhoCompliance = viewChild<ElementRef<HTMLElement>>('cabecalhoCompliance');
  // Cards de badges para animacao em stagger.
  readonly cardsBadges = viewChildren<ElementRef<HTMLElement>>('cardBadge');
  // Linhas do audit log para animacao temporal.
  readonly linhasAuditLog = viewChildren<ElementRef<HTMLElement>>('linhaAuditLog');

  // Estado visual do cabecalho.
  private readonly cabecalhoVisivel = signal(false);
  // Indices de badges ja visiveis.
  private readonly indicesBadgesVisiveis = signal<number[]>([]);
  // Indices de audit logs ja exibidos (temporal).
  private readonly indicesAuditLogsVisiveis = signal<number[]>([]);

  readonly badges: Badge[] = [
    {
      icon: 'security',
      label: 'LGPD Ready',
      sub: 'Conformidade com a Lei 13.709/2018',
    },
    {
      icon: 'lock',
      label: 'Offline-First',
      sub: 'Nenhum dado sai do ambiente da serventia',
    },
    {
      icon: 'assignment_turned_in',
      label: 'Normas da Corregedoria',
      sub: 'Aderente às Resoluções CNJ',
    },
    {
      icon: 'database',
      label: 'Auditoria PostgreSQL',
      sub: 'Padrão de rastreabilidade total',
    },
  ];

  readonly auditLogs: AuditLog[] = [
    { ts: '08:14:02', action: 'OCR_CLASSIFY', target: 'doc_0451.pdf', status: 'OK' },
    { ts: '08:14:05', action: 'FILE_RENAME', target: 'RG_JOAO_S.pdf', status: 'OK' },
    { ts: '08:14:09', action: 'BOT_RF_INIT', target: 'CPF 123.456.***', status: 'OK' },
    { ts: '08:14:22', action: 'CERT_DOWNLOAD', target: 'CND_RF_0451.pdf', status: 'OK' },
    { ts: '08:14:23', action: 'SESSION_DESTROY', target: 'browser_sess_7', status: 'OK' },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    // Fallback para testes e ambientes sem suporte a observers.
    if (typeof IntersectionObserver === 'undefined') {
      this.cabecalhoVisivel.set(true);
      this.indicesBadgesVisiveis.set(this.badges.map((_, indice) => indice));
      this.indicesAuditLogsVisiveis.set(this.auditLogs.map((_, indice) => indice));
      return;
    }

    this.iniciarObservadorCabecalho();
    this.iniciarObservadorBadges();
  }

  cabecalhoEstaVisivel(): boolean {
    return this.cabecalhoVisivel();
  }

  badgeEstaVisivel(indice: number): boolean {
    return this.indicesBadgesVisiveis().includes(indice);
  }

  auditLogEstaVisivel(indice: number): boolean {
    return this.indicesAuditLogsVisiveis().includes(indice);
  }

  atrasoBadge(indice: number): string {
    return `${indice * 0.1}s`;
  }

  private iniciarObservadorCabecalho(): void {
    const elementoCabecalho = this.cabecalhoCompliance()?.nativeElement;

    if (!elementoCabecalho) {
      return;
    }

    const observadorCabecalho = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          this.cabecalhoVisivel.set(true);
          this.iniciarTimelineAuditLogs();
          observadorCabecalho.unobserve(entrada.target);
        }
      },
      { threshold: 0.05 },
    );

    observadorCabecalho.observe(elementoCabecalho);

    this.referenciaDestruicao.onDestroy(() => {
      observadorCabecalho.disconnect();
    });
  }

  private iniciarObservadorBadges(): void {
    const elementosBadges = this.cardsBadges().map((card) => card.nativeElement);

    if (elementosBadges.length === 0) {
      return;
    }

    const observadorBadges = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          const atributoIndice = entrada.target.getAttribute('data-indice-badge');
          const indice = atributoIndice ? Number(atributoIndice) : Number.NaN;

          if (!Number.isNaN(indice)) {
            this.indicesBadgesVisiveis.update((indicesAtuais) => {
              if (indicesAtuais.includes(indice)) {
                return indicesAtuais;
              }

              return [...indicesAtuais, indice];
            });
          }

          observadorBadges.unobserve(entrada.target);
        }
      },
      { threshold: 0.08 },
    );

    for (const elementoBadge of elementosBadges) {
      observadorBadges.observe(elementoBadge);
    }

    this.referenciaDestruicao.onDestroy(() => {
      observadorBadges.disconnect();
    });
  }

  // Timeline dos audit logs: cada entrada aparece com atraso progressivo.
  private iniciarTimelineAuditLogs(): void {
    this.auditLogs.forEach((_, indice) => {
      const atrasoMs = 500 + indice * 380;
      setTimeout(() => {
        this.indicesAuditLogsVisiveis.update((indicesAtuais) => {
          if (indicesAtuais.includes(indice)) {
            return indicesAtuais;
          }

          return [...indicesAtuais, indice];
        });
      }, atrasoMs);
    });
  }
}
