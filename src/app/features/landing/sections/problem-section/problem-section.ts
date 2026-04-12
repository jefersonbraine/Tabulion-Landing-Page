import { ChangeDetectionStrategy, Component } from '@angular/core';

type LinhaProblema = {
  // Horario aproximado em que a tarefa acontecia na rotina antiga.
  hora: string;
  // Descricao da tarefa manual executada no periodo.
  tarefa: string;
  // Custo de tempo estimado da tarefa.
  custo: string;
};

@Component({
  selector: 'app-problem-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  templateUrl: './problem-section.html',
  styleUrl: './problem-section.css',
})
export class ProblemSection {
  // Lista cronologica das atividades manuais antes da automacao do Tabulion.
  readonly rotinaAntes: LinhaProblema[] = [
    {
      hora: '09h30',
      tarefa: 'Operador salvava manualmente 200+ imagens recebidas pelo WhatsApp',
      custo: '~2h',
    },
    {
      hora: '10h00',
      tarefa: 'Renomeação manual de cada arquivo — sem padrão, sem rastreabilidade',
      custo: '~1h30',
    },
    {
      hora: '13h00',
      tarefa: 'Acesso manual à Receita Federal, TRF4, CNDT — um CPF por vez',
      custo: '~3h',
    },
    {
      hora: '14h00',
      tarefa: 'Organização das certidões nas pastas corretas dos clientes',
      custo: '~1h',
    },
    {
      hora: '14h30',
      tarefa: 'Revisão e correções de erros de classificação e nomenclatura',
      custo: '~1h',
    },
  ];
}
