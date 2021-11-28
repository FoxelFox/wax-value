import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
	{ path: ':account', loadChildren: () => import('./overview/overview.module').then(m => m.OverviewModule)},
	{ path: ':account/history', loadChildren: () => import('./history/history.module').then(m => m.HistoryModule)}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
