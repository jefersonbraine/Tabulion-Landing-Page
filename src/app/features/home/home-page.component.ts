import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="home-page">
      <section class="hero shell-block">
        <p class="eyebrow">Tabulion RPA</p>
        <h1>Landing principal pronta para receber as seções do produto.</h1>
        <p class="lead">
          Estrutura inicial para composição de hero, provas sociais, diferenciais, arquitetura e
          CTA.
        </p>

        <div class="hero-grid">
          @for (item of highlights(); track item) {
            <article class="card">
              <span></span>
              <p>{{ item }}</p>
            </article>
          }
        </div>
      </section>

      <section class="content-grid" aria-label="Seções da landing">
        @for (section of sections(); track section.title) {
          <article class="section-card shell-block">
            <p class="section-kicker">{{ section.kicker }}</p>
            <h2>{{ section.title }}</h2>
            <p>{{ section.description }}</p>
          </article>
        }
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .home-page {
        min-height: 100vh;
        padding: clamp(1.5rem, 3vw, 3rem);
      }

      .shell-block {
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 28px;
        background: rgba(8, 15, 27, 0.72);
        backdrop-filter: blur(16px);
        box-shadow: 0 24px 80px rgba(2, 6, 23, 0.35);
      }

      .hero {
        padding: clamp(1.5rem, 4vw, 4rem);
        display: grid;
        gap: 1.5rem;
      }

      .eyebrow,
      .section-kicker {
        margin: 0;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-size: 0.75rem;
        color: #86b7ff;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        max-width: 14ch;
        font-size: clamp(2.4rem, 6vw, 5.5rem);
        line-height: 0.95;
        letter-spacing: -0.04em;
      }

      .lead,
      .section-card p {
        max-width: 60ch;
        color: #bbcae0;
        font-size: 1.03rem;
        line-height: 1.7;
      }

      .hero-grid,
      .content-grid {
        display: grid;
        gap: 1rem;
      }

      .hero-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .card,
      .section-card {
        padding: 1.2rem;
      }

      .card {
        display: grid;
        gap: 0.75rem;
        min-height: 120px;
      }

      .card span {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #86b7ff, #4fd1c5);
        box-shadow: 0 12px 36px rgba(79, 209, 197, 0.24);
      }

      .content-grid {
        margin-top: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .section-card {
        display: grid;
        gap: 0.75rem;
      }

      h2 {
        font-size: 1.3rem;
        letter-spacing: -0.02em;
      }
    `,
  ],
})
export class HomePageComponent {
  protected readonly highlights = signal([
    'Hero da landing',
    'Blocos de seções',
    'Fallback de rota',
  ]);

  protected readonly sections = computed(() => [
    {
      kicker: 'Seção 01',
      title: 'Arquitetura inicial',
      description: 'Espaço reservado para apresentar a base de navegação e composição do produto.',
    },
    {
      kicker: 'Seção 02',
      title: 'Diferenciais',
      description: 'Bloco preparado para destacar automação, controle e confiabilidade da solução.',
    },
    {
      kicker: 'Seção 03',
      title: 'Chamada para ação',
      description: 'Área destinada ao CTA principal e conversão da página principal.',
    },
  ]);
}
