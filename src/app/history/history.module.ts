import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {HistoryComponent} from "./history.component";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {HistoryService} from "./history.service";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {CommonModule} from "@angular/common";
import {FlexLayoutModule} from "@angular/flex-layout";

@NgModule({
	imports: [
		RouterModule.forChild([
			{path: "", component: HistoryComponent}
		]),
		MatButtonModule,
		MatIconModule,
		MatProgressBarModule,
		CommonModule,
		FlexLayoutModule
	],
	declarations: [
		HistoryComponent
	],
	providers: [
		HistoryService
	]
})
export class HistoryModule {

}
