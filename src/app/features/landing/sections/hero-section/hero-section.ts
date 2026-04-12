import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type NoDiagrama = {
  // Identificador único do nó no fluxo do diagrama.
  id: string;
  // Coordenada horizontal base do nó.
  x: number;
  // Coordenada vertical base do nó.
  y: number;
};

type ArestaDiagrama = {
  // Identificador do nó de origem da conexão.
  origemId: string;
  // Identificador do nó de destino da conexão.
  destinoId: string;
};

type LigacaoDiagrama = {
  // Referência ao nó de origem já resolvido.
  origem: NoDiagrama;
  // Referência ao nó de destino já resolvido.
  destino: NoDiagrama;
  // Posição horizontal atual do pacote animado na ligação.
  pacoteX: number;
  // Posição vertical atual do pacote animado na ligação.
  pacoteY: number;
};

// Total de letras usadas na animação de entrada do título principal.
const TOTAL_LETRAS_TITULO = 8;

// Nós fixos que compõem o diagrama da pipeline.
const NOS_DIAGRAMA: NoDiagrama[] = [
  { id: 'doc', x: 80, y: 60 },
  { id: 'ocr', x: 230, y: 30 },
  { id: 'cls', x: 380, y: 60 },
  { id: 'bot', x: 230, y: 140 },
  { id: 'cert', x: 380, y: 170 },
  { id: 'out', x: 510, y: 110 },
];

// Arestas que conectam os nós para formar o fluxo visual.
const ARESTAS_DIAGRAMA: ArestaDiagrama[] = [
  { origemId: 'doc', destinoId: 'ocr' },
  { origemId: 'ocr', destinoId: 'cls' },
  { origemId: 'cls', destinoId: 'out' },
  { origemId: 'doc', destinoId: 'bot' },
  { origemId: 'bot', destinoId: 'cert' },
  { origemId: 'cert', destinoId: 'out' },
];

// Interpola dois valores para mover o pacote ao longo da ligação.
function interpolarLinear(inicio: number, fim: number, fator: number): number {
  return inicio + (fim - inicio) * fator;
}

@Component({
  selector: 'app-hero-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection implements OnInit {
  // Referência para registrar limpezas quando o componente for destruído.
  private readonly referenciaDestruicao = inject(DestroyRef);
  // Identificador da plataforma atual para evitar animações fora do browser.
  private readonly idPlataforma = inject(PLATFORM_ID);

  // Lista de nós usada na renderização do diagrama no template.
  readonly nosDiagrama = NOS_DIAGRAMA;

  // Índices das letras do título que já ficaram visíveis na animação.
  private readonly letrasVisiveis = signal<number[]>([]);
  // Controla visibilidade da faixa de metadados (topo e rodapé).
  private readonly metadadosVisiveis = signal(false);
  // Controla visibilidade do conteúdo principal do hero.
  private readonly conteudoVisivel = signal(false);
  // Controla visibilidade da linha de varredura superior.
  private readonly varreduraVisivel = signal(false);
  // Valor contínuo usado para animar pacotes no diagrama.
  private readonly pulso = signal(0);
  // Posição atual do mouse no diagrama para aplicar efeito de parallax.
  private readonly mouseDiagrama = signal<{ x: number; y: number } | null>(null);

  // Ligações calculadas em tempo real para renderizar linhas e pacotes animados.
  readonly ligacoesDiagrama = computed<LigacaoDiagrama[]>(() =>
    ARESTAS_DIAGRAMA.map((aresta, indice) => {
      const origem = NOS_DIAGRAMA.find((no) => no.id === aresta.origemId);
      const destino = NOS_DIAGRAMA.find((no) => no.id === aresta.destinoId);

      if (!origem || !destino) {
        throw new Error(`Aresta de diagrama inválida: ${aresta.origemId} -> ${aresta.destinoId}`);
      }

      const progresso = (this.pulso() * 0.7 + indice * 0.25) % 1;

      return {
        origem,
        destino,
        pacoteX: interpolarLinear(origem.x, destino.x, progresso),
        pacoteY: interpolarLinear(origem.y, destino.y, progresso),
      };
    }),
  );

  ngOnInit(): void {
    this.executarSequenciaEntrada();
    this.executarCicloPulso();
  }

  // Agenda a sequência de entrada para letras, metadados e conteúdo.
  private executarSequenciaEntrada(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    // Armazena IDs de timeout para cancelar tudo no destroy.
    const temporizadores: number[] = [];
    // Função auxiliar para centralizar agendamento e rastreamento dos timeouts.
    const agendar = (retornoChamada: () => void, atraso: number): void => {
      const idTemporizador = window.setTimeout(retornoChamada, atraso);
      temporizadores.push(idTemporizador);
    };

    Array.from({ length: TOTAL_LETRAS_TITULO }).forEach((_, indice) => {
      agendar(
        () => {
          this.letrasVisiveis.update((atuais) => [...atuais, indice]);
        },
        120 + indice * 80,
      );
    });

    agendar(() => this.metadadosVisiveis.set(true), 300);
    agendar(() => this.varreduraVisivel.set(true), 200);
    agendar(() => this.conteudoVisivel.set(true), 700);

    this.referenciaDestruicao.onDestroy(() => {
      for (const idTemporizador of temporizadores) {
        window.clearTimeout(idTemporizador);
      }
    });
  }

  // Inicia loop contínuo que move os pacotes pelas arestas.
  private executarCicloPulso(): void {
    if (!isPlatformBrowser(this.idPlataforma)) {
      return;
    }

    // Guarda o último requestAnimationFrame para cancelamento seguro.
    let idQuadroAnimacao = 0;

    // Atualiza o valor de pulso a cada frame para animar o fluxo.
    const passo = (): void => {
      this.pulso.update((valor) => valor + 0.012);
      idQuadroAnimacao = window.requestAnimationFrame(passo);
    };

    idQuadroAnimacao = window.requestAnimationFrame(passo);

    this.referenciaDestruicao.onDestroy(() => {
      window.cancelAnimationFrame(idQuadroAnimacao);
    });
  }

  // Informa ao template se os metadados já podem aparecer.
  metadadosEstaoVisiveis(): boolean {
    return this.metadadosVisiveis();
  }

  // Informa ao template se o conteúdo principal já pode aparecer.
  conteudoEstaVisivel(): boolean {
    return this.conteudoVisivel();
  }

  // Informa ao template se a linha de varredura deve ser exibida.
  varreduraEstaVisivel(): boolean {
    return this.varreduraVisivel();
  }

  // Verifica se uma letra específica do título já entrou em cena.
  letraEstaVisivel(indice: number): boolean {
    return this.letrasVisiveis().includes(indice);
  }

  // Calcula atraso em cascata da transição de cada letra do título.
  atrasoLetra(indice: number): string {
    return `${indice * 0.04}s`;
  }

  // Captura movimento do mouse para calcular efeito de parallax do diagrama.
  aoMoverMouseNoDiagrama(evento: MouseEvent, elementoSvg: Element): void {
    if (!(elementoSvg instanceof SVGElement)) {
      return;
    }

    const retangulo = elementoSvg.getBoundingClientRect();

    if (retangulo.width <= 0 || retangulo.height <= 0) {
      return;
    }

    const eixoX = ((evento.clientX - retangulo.left) / retangulo.width) * 600;
    const eixoY = ((evento.clientY - retangulo.top) / retangulo.height) * 220;

    this.mouseDiagrama.set({ x: eixoX, y: eixoY });
  }

  // Reseta o parallax quando o ponteiro sai da área do diagrama.
  aoSairMouseDoDiagrama(): void {
    this.mouseDiagrama.set(null);
  }

  // Calcula deslocamento de cada nó conforme a posição atual do mouse.
  transformacaoNo(no: NoDiagrama): string {
    const mouseAtual = this.mouseDiagrama();

    if (!mouseAtual) {
      return `translate(${no.x}, ${no.y})`;
    }

    const deslocamentoX = (mouseAtual.x - no.x) * 0.024;
    const deslocamentoY = (mouseAtual.y - no.y) * 0.024;

    return `translate(${no.x + deslocamentoX}, ${no.y + deslocamentoY})`;
  }

  // Aplica deslocamento da superfície do SVG para reforçar sensação de profundidade.
  transformacaoSuperficieDiagrama(): string {
    const mouseAtual = this.mouseDiagrama();

    if (!mouseAtual) {
      return 'translate3d(0, 0, 0)';
    }

    const deslocamentoX = ((mouseAtual.x - 300) / 300) * 10;
    const deslocamentoY = ((mouseAtual.y - 110) / 110) * 10;

    return `translate3d(${deslocamentoX}px, ${deslocamentoY}px, 0)`;
  }

  // Move o grupo interno do SVG para um parallax mais sutil que o contêiner externo.
  transformacaoConteudoDiagrama(): string {
    const mouseAtual = this.mouseDiagrama();

    if (!mouseAtual) {
      return 'translate(0 0)';
    }

    const deslocamentoX = ((mouseAtual.x - 300) / 300) * 8;
    const deslocamentoY = ((mouseAtual.y - 110) / 110) * 8;

    return `translate(${deslocamentoX} ${deslocamentoY})`;
  }
}
