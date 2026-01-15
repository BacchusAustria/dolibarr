import { Injectable, signal } from '@angular/core';

export type ViewState = 'main' | 'customer' | 'payment' | 'history';

@Injectable({ providedIn: 'root' })
export class ViewService {
  private _currentView = signal<ViewState>('main');
  public currentView = this._currentView.asReadonly();

  navigateTo(view: ViewState) {
    this._currentView.set(view);
  }
}