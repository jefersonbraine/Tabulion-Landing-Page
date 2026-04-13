import { Component } from '@angular/core';
import { HeroSection } from './sections/hero-section/hero-section';
import { FooterSection } from './sections/footer-section/footer-section';
import { ProblemSection } from './sections/problem-section/problem-section';
import { SolutionSection } from './sections/solution-section/solution-section';
import { CaseStudySection } from './sections/case-study-section/case-study-section';
import { SpecialistSection } from './sections/specialist-section/specialist-section';

@Component({
  selector: 'app-landing',
  imports: [
    HeroSection,
    ProblemSection,
    SolutionSection,
    CaseStudySection,
    SpecialistSection,
    FooterSection,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
