import {NgModule} from "@angular/core";
import {OverviewComponent} from "./overview.component";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {FlexLayoutModule} from "@angular/flex-layout";

@NgModule({
	imports: [
		RouterModule.forChild([{
			path: '', component: OverviewComponent
		}]),
		CommonModule,
		FlexLayoutModule
	],
	declarations: [
		OverviewComponent
	]
})
export class OverviewModule {

}
