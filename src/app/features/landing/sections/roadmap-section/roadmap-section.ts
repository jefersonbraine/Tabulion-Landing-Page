import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  viewChild,
  viewChildren,
  ElementRef,
  signal,
  inject,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface ViagemItem {
  numero: string;
  titulo: string;
  detalhe: string;
  status: string;
  statusClasse: string;
}

@Component({
  selector: 'app-roadmap-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './roadmap-section.html',
  styleUrl: './roadmap-section.css',
})
export class RoadmapSection implements AfterViewInit {
  private readonly referenciaDestruicao = inject(DestroyRef);
  private readonly idPlataforma = inject(PLATFORM_ID);

  readonly cabecalho = viewChild<ElementRef>('cabecalho');
  readonly roteiroCels = viewChildren<ElementRef>('roteiroCel');
  readonly valoresCels = viewChildren<ElementRef>('valorCel');

  private readonly cabecalhoVisivel = signal(true);
  private readonly indicesRoteiroVisiveis = signal<number[]>([]);
  private readonly indicesValoresVisiveis = signal<number[]>([]);

  readonly viagens: ViagemItem[] = [
    {
      numero: '01',
      titulo: 'Interface Web para operadores não-técnicos',
      detalhe:
        'Painel visual para acompanhar filas, status de certidões e histórico de operações — sem CLI.',
      status: 'Em desenvolvimento',
      statusClasse: 'status-desenvolvimento',
    },
    {
      numero: '02',
      titulo: 'Suporte a portais estaduais adicionais',
      detalhe:
        'Expansão dos bots para cobrir Receitas Estaduais de todos os estados onde serventias utilizam o sistema.',
      status: 'Planejado',
      statusClasse: 'status-planejado',
    },
    {
      numero: '03',
      titulo: 'Processamento paralelo de lotes',
      detalhe:
        'Execução simultânea de múltiplos bots para certidões em lote — ideal para escrituras e inventários.',
      status: 'Planejado',
      statusClasse: 'status-planejado',
    },
    {
      numero: '04',
      titulo: 'Relatórios automáticos de produtividade',
      detalhe:
        'Dashboard para o Tabelião visualizar horas economizadas, certidões emitidas e documentos organizados por período.',
      status: 'Conceito',
      statusClasse: 'status-conceito',
    },
    {
      numero: '05',
      titulo: 'Integração com sistemas de gestão de cartório',
      detalhe:
        'Conectores para os principais SGCs do mercado — eliminando a última etapa manual do fluxo.',
      status: 'Conceito',
      statusClasse: 'status-conceito',
    },
  ];

  readonly valores: string[] = [
    'Construído por quem vive o provimento',
    '100% offline — nenhum dado sai da serventia',
    'Operação testada em campo, não em laboratório',
    'Responsabilidade jurídica compreendida pelo autor',
  ];

  isCelRoteiroVisivel(index: number): boolean {
    return this.indicesRoteiroVisiveis().includes(index);
  }

  isCelValorVisivel(index: number): boolean {
    return this.indicesValoresVisiveis().includes(index);
  }

  isCabecalhoVisivel(): boolean {
    return this.cabecalhoVisivel();
  }

  getValorNumero(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  atrasoRoteiro(index: number): string {
    return `${index * 0.08}s`;
  }

  atrasoValor(index: number): string {
    return `${index * 0.07}s`;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.idPlataforma)) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: marca tudo como visível
      this.cabecalhoVisivel.set(true);
      this.indicesRoteiroVisiveis.set([...Array(this.viagens.length).keys()]);
      this.indicesValoresVisiveis.set([...Array(this.valores.length).keys()]);
      return;
    }

    this.iniciarObservadorCabecalho();
    this.iniciarObservadorRoteiro();
    this.iniciarObservadorValores();
  }

  private iniciarObservadorCabecalho(): void {
    const cabecalhoEl = this.cabecalho()?.nativeElement;
    if (!cabecalhoEl) return;

    const observador = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.cabecalhoVisivel.set(true);
            observador.unobserve(cabecalhoEl);
          }
        });
      },
      { threshold: 0.05 },
    );

    observador.observe(cabecalhoEl);
    this.referenciaDestruicao.onDestroy(() => observador.disconnect());
  }

  private iniciarObservadorRoteiro(): void {
    const cells = this.roteiroCels();
    if (!cells || cells.length === 0) return;

    const observador = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const index = Number(el.getAttribute('data-index'));

          if (entry.isIntersecting) {
            this.indicesRoteiroVisiveis.update((indices) => [...new Set([...indices, index])]);
          }
        });
      },
      { threshold: 0.08 },
    );

    cells.forEach((cell, idx) => {
      const el = cell.nativeElement;
      el.setAttribute('data-index', String(idx));
      observador.observe(el);
    });

    this.referenciaDestruicao.onDestroy(() => observador.disconnect());
  }

  private iniciarObservadorValores(): void {
    const cells = this.valoresCels();
    if (!cells || cells.length === 0) return;

    const observador = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const index = Number(el.getAttribute('data-index'));

          if (entry.isIntersecting) {
            this.indicesValoresVisiveis.update((indices) => [...new Set([...indices, index])]);
          }
        });
      },
      { threshold: 0.1 },
    );

    cells.forEach((cell, idx) => {
      const el = cell.nativeElement;
      el.setAttribute('data-index', String(idx));
      observador.observe(el);
    });

    this.referenciaDestruicao.onDestroy(() => observador.disconnect());
  }
}
