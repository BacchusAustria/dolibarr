// src/app/components/category-navigation/category-navigation.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-navigation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-2 flex-shrink-0 border-b bg-gray-50">
      
      <input 
        type="text" 
        placeholder="Produkt suchen..."
        [ngModel]="searchTerm"
        (ngModelChange)="searchTermChange.emit($event)"
        class="w-full border rounded-lg p-2 mb-2 text-sm focus:ring-[#828f9a] focus:border-[#828f9a]"
      />
      
      <div class="flex items-center space-x-2 overflow-x-auto pb-1 mb-2">
        
        <button 
          (click)="categorySelect.emit(null)" 
          [class]="'p-1 px-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ' + 
                   (!selectedCategory ? 'bg-[#828f9a] text-white shadow' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100')"
        >
          Alle
        </button>
        
        @for (path of categoryPath; track path.id) {
          <span class="text-xs text-gray-400 flex-shrink-0">/</span>
          <button 
            (click)="categorySelect.emit(path.id)"
            class="p-1 px-3 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0"
          >
            {{ path.name }}
          </button>
        }
        
        @if (categoryPath.length) {
          <button 
            (click)="navigateBack.emit()"
            class="ml-auto p-1 px-3 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors whitespace-nowrap flex-shrink-0"
          >
            ← Zurück
          </button>
        }
      </div>
      
      <div class="flex space-x-2 overflow-x-auto pb-1 -mx-2 px-2">
        @for (category of categories; track category.id) {
          <button 
            (click)="categorySelect.emit(category.id)" 
            class="p-2 rounded-lg text-sm font-medium text-red shadow-md hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
          >
            {{ category.label }}
          </button>
        }
        @if (categories?.length === 0 && !categoryPath.length) {
          <p class="text-gray-500 text-sm p-2 flex-shrink-0">Keine Kategorien verfügbar.</p>
        }
      </div>
      
    </div>
  `,
  styles: ['']
})
export class CategoryNavigationComponent {
  // Inputs: Daten vom Container
  @Input() searchTerm: string = '';
  @Input() selectedCategory: string | null = null;
  @Input() categoryPath: Array<{ id: string; name: string }> = [];
  @Input() categories: Category[] | null = []; 

  // Outputs: Events zurück an den Container
  @Output() searchTermChange = new EventEmitter<string>(); 
  @Output() categorySelect = new EventEmitter<string | null>();
  @Output() navigateBack = new EventEmitter<void>();
}