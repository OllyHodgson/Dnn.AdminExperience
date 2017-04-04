import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import {
    importExport as ImportExportActions
} from "../../actions";
import DropDown from "dnn-dropdown";
import Pager from "dnn-pager";
import Button from "dnn-button";
import Label from "dnn-label";
import GridCell from "dnn-grid-cell";
import "./style.less";
import util from "../../utils";
import Localization from "localization";
import JobRow from "./JobRow";
import FiltersBar from "./FiltersBar";
import JobDetails from "./JobDetails";

class DashboardPanelBody extends Component {
    constructor() {
        super();
        this.state = {
            jobs: [],
            pageIndex: 0,
            pageSize: 10,
            filter: null,
            keyword: "",
            openId: ""
        };
    }

    componentWillMount() {
        const { props } = this;
        if (props.portals.length === 0) {
            props.dispatch(ImportExportActions.getPortals((data) => {
                if (data.TotalResults === 1) {
                    props.dispatch(ImportExportActions.siteSelected(data.Results[0].PortalID, data.Results[0].PortalName, () => {
                        this.getLastJobTime(data.Results[0].PortalID);
                        props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(data.Results[0].PortalID)));
                    }));
                }
                else {
                    this.getLastJobTime(props.portalId);
                    props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(props.portalId)));
                }
            }));
        }
    }

    getLastJobTime(portalId) {
        const { props } = this;
        if (portalId > -1) {
            props.dispatch(ImportExportActions.getLastExportTime({ "portal": portalId, "jobType": "Export" }));
            props.dispatch(ImportExportActions.getLastImportTime({ "portal": portalId, "jobType": "Import" }));
        }
    }

    uncollapse(id) {
        setTimeout(() => {
            this.setState({
                openId: id
            });
        }, this.timeout);
    }

    collapse() {
        if (this.state.openId !== "") {
            this.setState({
                openId: ""
            });
        }
    }

    toggle(openId) {
        if (openId !== "") {
            this.uncollapse(openId);
        }
        else {
            this.collapse();
        }
    }

    getNextPage(portalId) {
        const { state, props } = this;
        return {
            portal: portalId,
            pageIndex: state.pageIndex || 0,
            pageSize: state.pageSize,
            jobType: state.filter === -1 ? null : state.filter,
            keywords: state.keyword
        };
    }

    getPortalOptions() {
        const { props } = this;
        let options = [];
        if (props.portals) {
            options = props.portals.map((item) => {
                return {
                    label: item.PortalName,
                    value: item.PortalID
                };
            });
            if (options.length > 1) {
                options.unshift({ "label": Localization.get("AllSites"), "value": -1 });
            }
        }
        return options;
    }

    onPortalChange(option) {
        const { props } = this;
        if (option.value !== props.portalId) {
            this.setState({
                pageIndex: 0
            }, () => {
                props.dispatch(ImportExportActions.siteSelected(option.value, option.label));
                this.getLastJobTime(option.value);
                props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(option.value)));
            });
        }
    }

    onImportData() {
        const { props } = this;
        props.selectPanel(2);
    }

    onExportData() {
        const { props } = this;
        props.selectPanel(1);
    }

    onPageChange(currentPage, pageSize) {
        let { state, props } = this;
        if (pageSize !== undefined && state.pageSize !== pageSize) {
            state.pageSize = pageSize;
        }
        state.pageIndex = currentPage;
        this.setState({
            state
        }, () => {
            props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(props.portalId)));
        });
    }

    onFilterChanged(filter) {
        const { props } = this;
        this.setState({
            pageIndex: 0,
            filter: filter.value
        }, () => {
            props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(props.portalId)));
        });
    }

    onKeywordChanged(keyword) {
        const { props } = this;
        this.setState({
            pageIndex: 0,
            keyword: keyword
        }, () => {
            props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(props.portalId)));
        });
    }

    cancelJob(jobId) {
        const { props } = this;
        util.utilities.confirm(Localization.get("CancelJobMessage"),
            Localization.get("ConfirmCancel"),
            Localization.get("No"),
            () => {
                props.dispatch(ImportExportActions.cancelJob(jobId, (data) => {
                    util.utilities.notify(Localization.get("JobCancelled"));
                    this.toggle(jobId);
                    props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(props.portalId)));
                }, () => {
                    util.utilities.notifyError(Localization.get("JobCancel.ErrorMessage"));
                }));
            }
        );
    }

    deleteJob(jobId) {
        const { props } = this;
        util.utilities.confirm(Localization.get("DeleteJobMessage"),
            Localization.get("ConfirmDelete"),
            Localization.get("No"),
            () => {
                props.dispatch(ImportExportActions.deleteJob(jobId, (data) => {
                    util.utilities.notify(Localization.get("JobDeleted"));
                    this.collapse();
                    props.dispatch(ImportExportActions.getAllJobs(this.getNextPage(props.portalId)));
                }, () => {
                    util.utilities.notifyError(Localization.get("JobDelete.ErrorMessage"));
                }));
            }
        );
    }

    renderTopPane() {
        const { props } = this;
        return <div className="top-panel">
            <GridCell columnSize={100} >
                <div className="site-selection">
                    <DropDown
                        enabled={props.portals.length > 1 ? true : false}
                        options={this.getPortalOptions()}
                        value={props.portalId}
                        onSelect={this.onPortalChange.bind(this)}
                        prependWith={Localization.get("ShowSiteLabel")}
                    />
                </div>
                <div className="last-actions">
                    <div className="action-labels">
                        <Label
                            labelType="block"
                            label={Localization.get("LastImport")} />
                        <Label
                            labelType="block"
                            label={Localization.get("LastExport")} />
                    </div>
                    <div className="action-dates">
                        <div>{props.lastImportTime || "-- --"}</div>
                        <div>{props.lastExportTime || "-- --"}</div>
                    </div>
                </div>
                <div className="action-buttons">
                    <Button
                        disabled={props.portalId < 0}
                        className="action-button"
                        type="secondary"
                        onClick={this.onExportData.bind(this)}>
                        {Localization.get("ExportButton")}
                    </Button>
                    <Button
                        disabled={props.portalId < 0}
                        className="action-button"
                        type="secondary"
                        onClick={this.onImportData.bind(this)}>
                        {Localization.get("ImportButton")}
                    </Button>
                </div>
            </GridCell>
        </div>;
    }

    renderJobListHeader() {
        const tableFields = [
            { "name": "", "id": "Indicator" },
            { "name": Localization.get("JobDate.Header"), "id": "JobDate" },
            { "name": Localization.get("JobType.Header"), "id": "JobType" },
            { "name": Localization.get("JobUser.Header"), "id": "JobUser" },
            { "name": Localization.get("JobPortal.Header"), "id": "JobPortal" },
            { "name": Localization.get("JobStatus.Header"), "id": "JobStatus" },
            { "name": "", "id": "Arrow" }
        ];

        let tableHeaders = tableFields.map((field) => {
            let className = "jobHeader jobHeader-" + field.id;
            return <div className={className}>
                <span>{field.name}&nbsp; </span>
            </div>;
        });
        return <div className="jobHeader-wrapper">{tableHeaders}</div>;
    }

    renderedJobList() {
        const { props, state } = this;
        let i = 0;
        if (props.portals.length > 0 && props.jobs && props.jobs.length > 0) {
            return props.jobs.map((job, index) => {
                let id = "row-" + i++;
                return (
                    <JobRow
                        jobId={job.JobId}
                        jobType={job.JobType}
                        jobDate={job.CreatedOn}
                        jobUser={job.User}
                        jobPortal={props.portals.find(p => p.PortalID === job.PortalId).PortalName}
                        jobStatus={job.Status}
                        index={index}
                        key={"jobTerm-" + index}
                        closeOnClick={true}
                        openId={this.state.openId}
                        OpenCollapse={this.toggle.bind(this)}
                        Collapse={this.collapse.bind(this)}
                        id={id}>
                        <JobDetails
                            jobId={job.JobId}
                            Collapse={this.collapse.bind(this)}
                            id={id}
                            openId={this.state.openId}
                            cancelJob={this.cancelJob.bind(this)}
                            deleteJob={this.deleteJob.bind(this)} />
                    </JobRow>
                );
            });
        }
        else return <GridCell className="no-jobs">{Localization.get("NoJobs")}</GridCell>;
    }

    renderPager() {
        const { props, state } = this;
        return (
            <div className="logPager">
                {props.jobs && <Pager
                    showStartEndButtons={false}
                    showPageSizeOptions={true}
                    showPageInfo={false}
                    numericCounters={4}
                    pageSize={state.pageSize}
                    totalRecords={props.totalJobs}
                    onPageChanged={this.onPageChange.bind(this)}
                    pageSizeDropDownWithoutBorder={true}
                    pageSizeOptionText={"{0} results per page"}
                    summaryText={"Showing {0}-{1} of {2} results"}
                    culture={util.utilities.getCulture()}
                />}
            </div>
        );
    }

    renderedLegend() {
        const legendItems = [
            { "name": Localization.get("LegendExport"), "id": "legend-export" },
            { "name": Localization.get("LegendImport"), "id": "legend-import" }
        ];
        let legend = legendItems.map((item) => {
            return <div className="logLegend-item">
                <div className={item.id}>
                    <span></span>
                </div>
                <div>
                    <span>{item.name}</span>
                </div>
            </div>;
        });

        return <div className="logLegend-wrapper">{legend}</div>;
    }

    render() {
        const { props, state } = this;
        return (
            <div>
                {props.portals.length > 0 && <div>
                    {this.renderTopPane()}
                    <div className="section-title">{Localization.get("LogSection")}</div>
                    <FiltersBar onFilterChanged={this.onFilterChanged.bind(this)}
                        onKeywordChanged={this.onKeywordChanged.bind(this)}
                    />
                    <div className="logContainer">
                        <div className="logContainerBox">
                            {this.renderJobListHeader()}
                            {this.renderedJobList()}
                        </div>
                    </div>
                    {this.renderPager()}
                    {this.renderedLegend()}
                </div>
                }
            </div>
        );
    }
}

DashboardPanelBody.propTypes = {
    dispatch: PropTypes.func.isRequired,
    jobs: PropTypes.array,
    portals: PropTypes.array,
    totalJobs: PropTypes.number,
    portalName: PropTypes.string,
    selectPanel: PropTypes.func,
    portalId: PropTypes.number,
    lastExportTime: PropTypes.string,
    lastImportTime: PropTypes.string
};

function mapStateToProps(state) {
    return {
        jobs: state.importExport.jobs,
        portalId: state.importExport.portalId,
        portals: state.importExport.portals,
        totalJobs: state.importExport.totalJobs,
        portalName: state.importExport.portalName,
        lastExportTime: state.importExport.lastExportDate,
        lastImportTime: state.importExport.lastImportDate
    };
}

export default connect(mapStateToProps)(DashboardPanelBody);