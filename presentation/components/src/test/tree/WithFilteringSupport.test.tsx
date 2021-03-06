/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
/* tslint:disable:no-direct-imports */

import * as React from "react";
import { expect } from "chai";
import * as sinon from "sinon";
import { shallow, ShallowWrapper } from "enzyme";
import * as faker from "faker";
import * as moq from "@bentley/presentation-common/lib/test/_helpers/Mocks";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { Tree, ActiveMatchInfo } from "@bentley/ui-components";
import { treeWithFilteringSupport, Props } from "../../tree/WithFilteringSupport";
import { FilteredPresentationTreeDataProvider } from "../../tree/FilteredDataProvider";
import { IPresentationTreeDataProvider } from "../../tree/IPresentationTreeDataProvider";

// tslint:disable-next-line:variable-name naming-convention
const PresentationTree = treeWithFilteringSupport(Tree);
interface State {
  filteredDataProvider?: FilteredPresentationTreeDataProvider;
}

const defaultState: State = {
  filteredDataProvider: undefined,
};

describe("Tree withFilteringSupport", () => {

  let testRulesetId: string;
  let tree: ShallowWrapper<Props, State, any>;
  let treeInstance: React.Component<Props, State, any>;
  const imodelMock = moq.Mock.ofType<IModelConnection>();
  const dataProviderMock = moq.Mock.ofType<IPresentationTreeDataProvider>();
  const filter = "filter";
  const onFilterAppliedMock = moq.Mock.ofType<(propsFilter?: string) => void>();

  beforeEach(() => {
    testRulesetId = faker.random.word();
    setupDataProvider(dataProviderMock, imodelMock.object, testRulesetId);
    tree = shallow(<PresentationTree dataProvider={dataProviderMock.object} filter={filter} />, { disableLifecycleMethods: true });
    treeInstance = tree.instance();
    expect(treeInstance.state.filteredDataProvider).to.be.undefined;
  });

  const setupDataProvider = (providerMock: moq.IMock<IPresentationTreeDataProvider>, imodel: IModelConnection, rulesetId: string) => {
    providerMock.reset();
    providerMock.setup((x) => x.imodel).returns(() => imodel!);
    providerMock.setup((x) => x.rulesetId).returns(() => rulesetId!);
    providerMock.setup((x) => x.getFilteredNodePaths(moq.It.isAnyString())).returns(async () => []);
  };

  describe("componentDidUpdate", () => {

    beforeEach(() => {
      onFilterAppliedMock.reset();
      expect(treeInstance.componentDidUpdate).to.not.be.undefined;
      expect(treeInstance.state.filteredDataProvider).to.be.undefined;
    });

    it("creates new filtered data provider if filter changed", async () => {
      tree.setProps({ dataProvider: dataProviderMock.object, filter, onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidUpdate!({ dataProvider: dataProviderMock.object, filter: "previous filter", onFilterApplied: onFilterAppliedMock.object }, defaultState);
      const state = treeInstance.state;
      expect(state.filteredDataProvider).to.not.be.undefined;
      expect(state.filteredDataProvider instanceof FilteredPresentationTreeDataProvider).to.be.true;
      onFilterAppliedMock.verify((x) => x(filter), moq.Times.never());
    });

    it("creates new filtered data provider if ruleset changed", async () => {
      const anotherProviderMock = moq.Mock.ofType<IPresentationTreeDataProvider>();
      setupDataProvider(anotherProviderMock, dataProviderMock.object.imodel, faker.random.word());
      expect(anotherProviderMock.object.rulesetId).to.be.not.equal(dataProviderMock.object.rulesetId);

      tree.setProps({ dataProvider: dataProviderMock.object, filter, onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidUpdate!({ dataProvider: anotherProviderMock.object, filter }, defaultState);
      const state = treeInstance.state;
      expect(state.filteredDataProvider).to.not.be.undefined;
      expect(state.filteredDataProvider instanceof FilteredPresentationTreeDataProvider).to.be.true;
      onFilterAppliedMock.verify((x) => x(filter), moq.Times.never());
    });

    it("creates new filtered data provider if imodel changed", async () => {
      const anotherProviderMock = moq.Mock.ofType<IPresentationTreeDataProvider>();
      setupDataProvider(anotherProviderMock, moq.Mock.ofType<IModelConnection>().object, dataProviderMock.object.rulesetId);
      expect(anotherProviderMock.object.imodel).to.be.not.equal(dataProviderMock.object.imodel);

      tree.setProps({ dataProvider: dataProviderMock.object, filter, onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidUpdate!({ dataProvider: anotherProviderMock.object, filter }, defaultState);
      const state = treeInstance.state;
      expect(state.filteredDataProvider).to.not.be.undefined;
      expect(state.filteredDataProvider instanceof FilteredPresentationTreeDataProvider).to.be.true;
      onFilterAppliedMock.verify((x) => x(filter), moq.Times.never());
    });

    it("does not create new filtered data provider if current filter is empty", async () => {
      const anotherProviderMock = moq.Mock.ofType<IPresentationTreeDataProvider>();
      setupDataProvider(anotherProviderMock, moq.Mock.ofType<IModelConnection>().object, faker.random.word());
      expect(anotherProviderMock.object.rulesetId).to.be.not.equal(dataProviderMock.object.rulesetId);
      expect(anotherProviderMock.object.imodel).to.be.not.equal(dataProviderMock.object.imodel);

      tree.setProps({ dataProvider: dataProviderMock.object, filter: "", onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidUpdate!({ dataProvider: anotherProviderMock.object, filter }, defaultState);
      expect(treeInstance.state.filteredDataProvider).to.be.undefined;
      onFilterAppliedMock.verify((x) => x(""), moq.Times.once());
    });

    it("does not create new filtered data provider if current filter is undefined", async () => {
      const anotherProviderMock = moq.Mock.ofType<IPresentationTreeDataProvider>();
      setupDataProvider(anotherProviderMock, moq.Mock.ofType<IModelConnection>().object, faker.random.word());
      expect(anotherProviderMock.object.rulesetId).to.be.not.equal(dataProviderMock.object.rulesetId);
      expect(anotherProviderMock.object.imodel).to.be.not.equal(dataProviderMock.object.imodel);

      tree.setProps({ dataProvider: dataProviderMock.object, filter: undefined, onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidUpdate!({ dataProvider: anotherProviderMock.object, filter }, defaultState);
      expect(treeInstance.state.filteredDataProvider).to.be.undefined;
      onFilterAppliedMock.verify((x) => x(undefined), moq.Times.once());

    });

    it("does not create new filtered data provider if filter, ruleset and imodel did not change and filteredDataProvider is not set", async () => {
      tree.setProps({ dataProvider: dataProviderMock.object, filter, onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidUpdate!({ dataProvider: dataProviderMock.object, filter }, defaultState);
      const filteredDataProvider = treeInstance.state.filteredDataProvider;
      expect(filteredDataProvider).to.be.undefined;
      onFilterAppliedMock.verify((x) => x(filter), moq.Times.never());
    });

    it("does not create new filtered data provider if filter, ruleset and imodel did not change", async () => {
      const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();
      filteredDataProviderMock.setup((x) => x.rulesetId).returns(() => dataProviderMock.object.rulesetId);
      filteredDataProviderMock.setup((x) => x.imodel).returns(() => dataProviderMock.object.imodel);
      filteredDataProviderMock.setup((x) => x.filter).returns(() => filter);
      tree.setState({ filteredDataProvider: filteredDataProviderMock.object });
      tree.setProps({ dataProvider: dataProviderMock.object, filter, onFilterApplied: onFilterAppliedMock.object });

      await treeInstance.componentDidUpdate!({ dataProvider: dataProviderMock.object, filter }, defaultState);
      const filteredDataProvider = treeInstance.state.filteredDataProvider;
      expect(filteredDataProvider).to.be.equal(filteredDataProviderMock.object);
      onFilterAppliedMock.verify((x) => x(filter), moq.Times.once());

    });

  });

  describe("componentDidMount", () => {

    beforeEach(() => {
      onFilterAppliedMock.reset();
      expect(treeInstance.componentDidMount).to.not.be.undefined;
      expect(treeInstance.state.filteredDataProvider).to.be.undefined;
    });

    it("creates new filtered data provider if filter is not empty or undefined", async () => {
      tree.setProps({ dataProvider: dataProviderMock.object, filter, onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidMount!();

      const state = treeInstance.state;
      expect(state.filteredDataProvider).to.not.be.undefined;
      expect(state.filteredDataProvider instanceof FilteredPresentationTreeDataProvider).to.be.true;
      onFilterAppliedMock.verify((x) => x(filter), moq.Times.never());
    });

    it("does not create new filtered data provider if filter is empty", async () => {
      tree.setProps({ dataProvider: dataProviderMock.object, filter: "", onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidMount!();

      const state = treeInstance.state;
      expect(state.filteredDataProvider).to.be.undefined;
      onFilterAppliedMock.verify((x) => x(""), moq.Times.once());
    });

    it("does not create new filtered data provider if filter is undefined", async () => {
      tree.setProps({ dataProvider: dataProviderMock.object, filter: undefined, onFilterApplied: onFilterAppliedMock.object });
      await treeInstance.componentDidMount!();

      const state = treeInstance.state;
      expect(state.filteredDataProvider).to.be.undefined;
      onFilterAppliedMock.verify((x) => x(undefined), moq.Times.once());
    });

    it("does not call onFilterApplied if it is not set", async () => {
      tree.setProps({ dataProvider: dataProviderMock.object, filter: undefined });
      await treeInstance.componentDidMount!();

      onFilterAppliedMock.verify((x) => x(filter), moq.Times.never());
    });

  });

  describe("getDerivedStateFromProps", () => {
    const getDerivedStateFromProps: (nextProps: Props, state: State) => State = (PresentationTree as any).getDerivedStateFromProps;
    const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();

    before(() => {
      expect(getDerivedStateFromProps).to.not.be.undefined;
    });

    it("does not change filteredDataProvider if filter is not empty or undefined", async () => {
      const state = { filteredDataProvider: filteredDataProviderMock.object, displayOverlay: false };

      const result = getDerivedStateFromProps({ dataProvider: dataProviderMock.object, filter: "filter" }, state);
      expect(result.filteredDataProvider).to.be.equal(state.filteredDataProvider);
    });

    it("clears filteredDataProvider if filter is empty", async () => {
      const state = { filteredDataProvider: filteredDataProviderMock.object, displayOverlay: false };

      const result = getDerivedStateFromProps({ dataProvider: dataProviderMock.object, filter: "" }, state);
      expect(result.filteredDataProvider).to.be.undefined;
    });

    it("clears filteredDataProvider if filter is undefined", async () => {
      const state = { filteredDataProvider: filteredDataProviderMock.object, displayOverlay: false };

      const result = getDerivedStateFromProps({ dataProvider: dataProviderMock.object, filter: undefined }, state);
      expect(result.filteredDataProvider).to.be.undefined;
    });

  });

  describe("loadDataProvider", () => {
    it("does not set state if filter changed while loading provider", async () => {
      const anotherDataProviderMock = moq.Mock.ofType<IPresentationTreeDataProvider>();
      anotherDataProviderMock.setup((x) => x.getFilteredNodePaths(moq.It.isAnyString()))
        .callback(() => { tree.setProps({ dataProvider: anotherDataProviderMock.object, filter: "different filter" }); })
        .returns(async () => []);
      tree.setProps({ dataProvider: anotherDataProviderMock.object, filter });
      expect(treeInstance.componentDidMount).to.not.be.undefined;
      expect(treeInstance.state.filteredDataProvider).to.be.undefined;

      await treeInstance.componentDidMount!();
      expect(treeInstance.state.filteredDataProvider).to.be.undefined;
    });

    it("calls onMatchesCounted if it's given through props", async () => {
      const cb = sinon.spy();
      tree.setProps({ onMatchesCounted: cb });

      if (treeInstance.componentDidMount)
        await treeInstance.componentDidMount();

      expect(cb).to.be.calledOnce;
    });
  });

  describe("render", () => {

    it("renders without overlay if filter is undefined", () => {
      tree.setState({ filteredDataProvider: undefined });
      tree.setProps({ filter: undefined, dataProvider: dataProviderMock.object });
      expect(treeInstance.render()).to.matchSnapshot();
    });

    it("renders without overlay if filter is empty", () => {
      tree.setState({ filteredDataProvider: undefined });
      tree.setProps({ filter: "", dataProvider: dataProviderMock.object });
      expect(treeInstance.render()).to.matchSnapshot();
    });

    it("renders with overlay if filter is different", () => {
      const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();
      filteredDataProviderMock.setup((x) => x.rulesetId).returns(() => dataProviderMock.object.rulesetId);
      filteredDataProviderMock.setup((x) => x.imodel).returns(() => dataProviderMock.object.imodel);
      filteredDataProviderMock.setup((x) => x.filter).returns(() => "different filter");

      tree.setState({ filteredDataProvider: filteredDataProviderMock.object });
      tree.setProps({ filter, dataProvider: dataProviderMock.object });

      expect(treeInstance.render()).to.matchSnapshot();
    });

    it("renders with overlay if rulesetId is different", async () => {
      const differentRulesetId = faker.random.word();
      expect(differentRulesetId).to.not.be.equal(dataProviderMock.object.rulesetId);
      const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();
      filteredDataProviderMock.setup((x) => x.rulesetId).returns(() => differentRulesetId);
      filteredDataProviderMock.setup((x) => x.imodel).returns(() => dataProviderMock.object.imodel);
      filteredDataProviderMock.setup((x) => x.filter).returns(() => filter);

      tree.setState({ filteredDataProvider: filteredDataProviderMock.object });
      tree.setProps({ filter, dataProvider: dataProviderMock.object });

      expect(treeInstance.render()).to.matchSnapshot();
    });

    it("renders with overlay if imodel is different", async () => {
      const anotherConnectionMock = moq.Mock.ofType<IModelConnection>();
      const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();
      filteredDataProviderMock.setup((x) => x.rulesetId).returns(() => dataProviderMock.object.rulesetId);
      filteredDataProviderMock.setup((x) => x.imodel).returns(() => anotherConnectionMock.object);
      filteredDataProviderMock.setup((x) => x.filter).returns(() => filter);

      tree.setState({ filteredDataProvider: filteredDataProviderMock.object });
      tree.setProps({ filter, dataProvider: dataProviderMock.object });

      expect(treeInstance.render()).to.matchSnapshot();
    });

    it("renders without overlay if nothing is different", async () => {
      const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();
      filteredDataProviderMock.setup((x) => x.rulesetId).returns(() => dataProviderMock.object.rulesetId);
      filteredDataProviderMock.setup((x) => x.imodel).returns(() => dataProviderMock.object.imodel);
      filteredDataProviderMock.setup((x) => x.filter).returns(() => filter);

      tree.setState({ filteredDataProvider: filteredDataProviderMock.object });
      tree.setProps({ filter, dataProvider: dataProviderMock.object });

      expect(treeInstance.render()).to.matchSnapshot();
    });

    it("renders with highlightingProps only if filter is set", async () => {
      const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();
      filteredDataProviderMock.setup((x) => x.getActiveMatch(moq.It.isAny())).returns(() => ({ nodeId: "test", matchIndex: 0 }));

      tree.setState({ filteredDataProvider: filteredDataProviderMock.object });
      tree.setProps({ activeMatchIndex: 6, filter: undefined });
      expect(tree.shallow().find(Tree).props().nodeHighlightingProps).to.be.undefined;

      tree.setProps({ activeMatchIndex: 6, filter: "" });
      expect(tree.shallow().find(Tree).props().nodeHighlightingProps).to.be.undefined;
    });

    it("renders with full highlightingProps", async () => {
      const filteredDataProviderMock = moq.Mock.ofType<FilteredPresentationTreeDataProvider>();
      const activeMatch: ActiveMatchInfo = { nodeId: "test", matchIndex: 0 };
      filteredDataProviderMock.setup((x) => x.getActiveMatch(moq.It.isAny())).returns(() => activeMatch);

      tree.setState({ filteredDataProvider: filteredDataProviderMock.object });
      tree.setProps({ activeMatchIndex: 6 });

      expect(tree.shallow().find(Tree).props().nodeHighlightingProps).to.deep.eq({
        searchText: filter,
        activeMatch,
      });
    });

  });

});
