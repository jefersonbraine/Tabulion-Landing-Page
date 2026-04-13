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

type PortalResiliencia = {
  // Sigla curta exibida em destaque.
  sigla: string;
  // Nome do portal ou orgao.
  nome: string;
  // Ambito regulatorio do portal.
  ambito: string;
  // Descricao da certidao ou resultado esperado.
  cert: string;
};

type PilarResiliencia = {
  // Titulo curto do mecanismo de resiliencia.
  titulo: string;
  // Explicacao objetiva do comportamento.
  desc: string;
};

@Component({
  selector: 'app-government-resilience-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './government-resilience-section.html',
  styleUrl: './government-resilience-section.css',
})
export class GovernmentResilienceSection implements AfterViewInit {
  // Referencia para limpeza de observers.
  private readonly referenciaDestruicao = inject(DestroyRef);
  // Plataforma para evitar APIs de browser no SSR.
  private readonly idPlataforma = inject(PLATFORM_ID);

  // Cabecalho principal da secao.
  readonly cabecalhoResiliencia = viewChild<ElementRef<HTMLElement>>('cabecalhoResiliencia');
  // Cards dos portais.
  readonly cardsPortais = viewChildren<ElementRef<HTMLElement>>('cardPortal');
  // Cards dos pilares de resiliencia.
  readonly cardsPilares = viewChildren<ElementRef<HTMLElement>>('cardPilar');

  // Estado de visibilidade do cabecalho.
  private readonly cabecalhoVisivel = signal(false);
  // Indices dos portais visiveis.
  private readonly indicesPortaisVisiveis = signal<number[]>([]);
  // Indices dos pilares visiveis.
  private readonly indicesPilaresVisiveis = signal<number[]>([]);

  readonly portais: PortalResiliencia[] = [
    {
      sigla: 'RF',
      nome: 'Receita Federal',
      ambito: 'Federal',
      cert: 'CND Federal · CPF · CNPJ',
    },
    {
      sigla: 'CNDT',
      nome: 'Débitos Trabalhistas',
      ambito: 'Trabalhista',
      cert: 'CND Trabalhista - TST',
    },
    {
      sigla: 'TRF4',
      nome: 'Tribunal Federal 4ª',
      ambito: 'Judicial',
      cert: 'Certidão Cível e Criminal',
    },
    {
      sigla: 'RE',
      nome: 'Receita Estadual',
      ambito: 'Estadual',
      cert: 'CND Estadual por UF',
    },
  ];

  readonly pilares: PilarResiliencia[] = [
    {
      titulo: 'Retry com Backoff',
      desc: 'Portal fora do ar? O bot aguarda e reexecuta automaticamente - até 3 tentativas com intervalo configurável.',
    },
    {
      titulo: 'Seletores com Fallback',
      desc: 'Se o site muda o layout, o sistema usa seletores alternativos. O fluxo não é interrompido por redesigns.',
    },
    {
      titulo: 'Sessão Isolada',
      desc: 'Cada bot abre sua própria sessão de browser. Falha em um portal não contamina os demais.',
    },
    {
      titulo: 'Download Verificado',
      desc: 'Cada certidão baixada é verificada por tamanho e integridade antes de ser arquivada.',
    },
    {
      titulo: 'CAPTCHA Assistido',
      desc: 'Quando necessário, o sistema pausa e notifica o operador. Resolvido, retoma automaticamente.',
    },
    {
      titulo: 'Log em Tempo Real',
      desc: 'Todo evento - sucesso, falha, retry - é registrado com timestamp. Auditoria disponível ao Tabelião.',
    },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      this.cabecalhoVisivel.set(true);
      this.indicesPortaisVisiveis.set(this.portais.map((_, indice) => indice));
      this.indicesPilaresVisiveis.set(this.pilares.map((_, indice) => indice));
      return;
    }

    this.iniciarObservadorCabecalho();
    this.iniciarObservadorPortais();
    this.iniciarObservadorPilares();
  }

  cabecalhoEstaVisivel(): boolean {
    return this.cabecalhoVisivel();
  }

  portalEstaVisivel(indice: number): boolean {
    return this.indicesPortaisVisiveis().includes(indice);
  }

  pilarEstaVisivel(indice: number): boolean {
    return this.indicesPilaresVisiveis().includes(indice);
  }

  atrasoPortal(indice: number): string {
    return `${indice * 0.08}s`;
  }

  atrasoPilar(indice: number): string {
    return `${indice * 0.06}s`;
  }

  private iniciarObservadorCabecalho(): void {
    const elementoCabecalho = this.cabecalhoResiliencia()?.nativeElement;

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

  private iniciarObservadorPortais(): void {
    const elementosPortais = this.cardsPortais().map((card) => card.nativeElement);

    if (elementosPortais.length === 0) {
      return;
    }

    const observadorPortais = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          const atributoIndice = entrada.target.getAttribute('data-indice-portal');
          const indice = atributoIndice ? Number(atributoIndice) : Number.NaN;

          if (!Number.isNaN(indice)) {
            this.indicesPortaisVisiveis.update((indicesAtuais) => {
              if (indicesAtuais.includes(indice)) {
                return indicesAtuais;
              }

              return [...indicesAtuais, indice];
            });
          }

          observadorPortais.unobserve(entrada.target);
        }
      },
      { threshold: 0.08 },
    );

    for (const elementoPortal of elementosPortais) {
      observadorPortais.observe(elementoPortal);
    }

    this.referenciaDestruicao.onDestroy(() => {
      observadorPortais.disconnect();
    });
  }

  private iniciarObservadorPilares(): void {
    const elementosPilares = this.cardsPilares().map((card) => card.nativeElement);

    if (elementosPilares.length === 0) {
      return;
    }

    const observadorPilares = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) {
            continue;
          }

          const atributoIndice = entrada.target.getAttribute('data-indice-pilar');
          const indice = atributoIndice ? Number(atributoIndice) : Number.NaN;

          if (!Number.isNaN(indice)) {
            this.indicesPilaresVisiveis.update((indicesAtuais) => {
              if (indicesAtuais.includes(indice)) {
                return indicesAtuais;
              }

              return [...indicesAtuais, indice];
            });
          }

          observadorPilares.unobserve(entrada.target);
        }
      },
      { threshold: 0.08 },
    );

    for (const elementoPilar of elementosPilares) {
      observadorPilares.observe(elementoPilar);
    }

    this.referenciaDestruicao.onDestroy(() => {
      observadorPilares.disconnect();
    });
  }
}
