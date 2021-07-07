import React, {useState} from 'react';
import {Col, Row} from 'antd';
import styled from 'styled-components';
import micromatch from 'micromatch';
import {useSelector} from 'react-redux';

import '@styles/NavigatorPane.css';
import {FontColors} from '@styles/Colors';
import {selectK8sResource} from '@redux/reducers/main';
import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {getNamespaces} from '@redux/utils/resource';
import {setFilterObjects} from '@redux/reducers/appConfig';
import {selectKustomizations, selectActiveResources} from '@redux/selectors';
import {K8sResource} from '@models/k8sresource';
import {NavigatorSubSection} from '@models/navigator';
import {hasIncomingRefs, hasOutgoingRefs, hasUnsatisfiedRefs} from '@redux/utils/resourceRefs';
import {previewKustomization} from '@redux/reducers/thunks';
import {MonoSwitch, MonoSectionHeaderCol, MonoSectionTitle, PaneContainer} from '@atoms';
import NavigatorKustomizationRow from '@molecules/NavigatorKustomizationRow';

const ALL_NAMESPACES = '- all -';

const TitleRow = styled(Row)`
  width: 100%;
  margin: 0;
  padding: 0;
`;

const SectionRow = styled(Row)`
  width: 100%;
  margin: 0;
  padding: 0;
`;

const ItemRow = styled(Row)`
  width: 100%;
  margin: 0;
  padding: 0;
`;

const SectionCol = styled(Col)`
  width: 100%;
  margin: 0;
  padding: 0;
`;

const SectionTitle = styled.h5`
  font-size: 1.2em;
  text-align: left;
  color: ${FontColors.darkThemeMainFont};
`;

const NavigatorPane = () => {
  const dispatch = useAppDispatch();
  const [namespace, setNamespace] = useState<string>(ALL_NAMESPACES);

  const resourceMap = useAppSelector(state => state.main.resourceMap);
  const selectedResource = useAppSelector(state => state.main.selectedResource);
  const previewResource = useAppSelector(state => state.main.previewResource);
  const appConfig = useAppSelector(state => state.config);
  const kustomizations = useSelector(selectKustomizations);
  const resources = useSelector(selectActiveResources);

  const selectResource = (resourceId: string) => {
    dispatch(selectK8sResource(resourceId));
  };

  const onFilterChange = (checked: boolean) => {
    dispatch(setFilterObjects(checked));
  };

  const handleNamespaceChange = (event: any) => {
    setNamespace(event.target.value);
  };

  const selectPreview = (id: string) => {
    if (id !== selectedResource) {
      dispatch(selectK8sResource(id));
    }
    dispatch(previewKustomization(id));
  };

  function shouldBeVisible(item: K8sResource, subsection: NavigatorSubSection) {
    return (
      (!appConfig.settings.filterObjectsOnSelection || item.highlight || item.selected || !selectedResource) &&
      item.kind === subsection.kindSelector &&
      micromatch.isMatch(item.version, subsection.apiVersionSelector) &&
      (namespace === ALL_NAMESPACES || item.namespace === namespace || (namespace === 'default' && !item.namespace))
    );
  }

  return (
    <PaneContainer>
      <TitleRow>
        <MonoSectionHeaderCol span={24}>
          <Row>
            <Col span={12}>
              <MonoSectionTitle>Navigator</MonoSectionTitle>
            </Col>
            <Col span={12}
            >
              <MonoSwitch
                onClick={onFilterChange}
                label='RELATIONS'
              />
            </Col>
          </Row>
        </MonoSectionHeaderCol>
      </TitleRow>

      {kustomizations.length > 0 && (
        <SectionRow>
          <SectionCol>
            <SectionRow>
              <SectionCol>
                <SectionTitle>Kustomizations</SectionTitle>
              </SectionCol>
            </SectionRow>
            {kustomizations
              .filter(
                k =>
                  !appConfig.settings.filterObjectsOnSelection ||
                  k.highlight ||
                  k.selected ||
                  !selectedResource ||
                  previewResource === k.id
              )
              .map((k: K8sResource) => {
                let className = '';
                if (previewResource && previewResource !== k.id) {
                  className = 'disabledItem';
                } else if (k.selected || previewResource === k.id) {
                  className = 'selectedItem';
                } else if (k.highlight) {
                  className = 'highlightItem';
                }

                const isSelected = (k.selected || previewResource === k.id);
                const isDisabled = Boolean(previewResource && previewResource !== k.id);
                const isHighlighted = k.highlight;

                const buttonActive = previewResource !== undefined && previewResource === k.id;
                // const buttonDisabled = previewResource !== undefined && previewResource !== k.id;

                return (
                  <NavigatorKustomizationRow
                    key={k.id}
                    resource={k}
                    isSelected={isSelected}
                    isDisabled={isDisabled}
                    highlighted={isHighlighted}
                    previewButtonActive={buttonActive}
                    hasIncomingRefs={Boolean(hasIncomingRefs(k))}
                    hasOutgoingRefs={Boolean(hasOutgoingRefs(k))}
                    onClickResource={!previewResource || previewResource === k.id ? () => selectResource(k.id) : undefined}
                    onClickPreview={() => selectPreview(k.id)}
                  />
                );
              })}
          </SectionCol>
        </SectionRow>
      )}
      <SectionRow>
        Filter namespace:
        <select onChange={handleNamespaceChange}>
          <option>{ALL_NAMESPACES}</option>
          {getNamespaces(resourceMap).map(n => {
            return <option key={n}>{n}</option>;
          })}
        </select>
      </SectionRow>

      <SectionRow>
        <SectionCol>
          {appConfig.navigators.map(navigator => {
            return (
              <>
                <SectionRow>
                  <SectionTitle>{navigator.name}</SectionTitle>
                </SectionRow>
                <SectionRow>
                  <SectionCol>
                    {navigator.sections.map(section => {
                      return (
                        <>
                          {section.name.length > 0 && (
                            <SectionRow>
                              <h6>{section.name}</h6>
                            </SectionRow>
                          )}
                          <SectionRow key={section.name}>
                            {section.subsections.map(subsection => {
                              const items = resources.filter(item => shouldBeVisible(item, subsection));
                              return (
                                <SectionCol key={subsection.name}>
                                  <h6>
                                    {subsection.name} {items.length > 0 ? `(${items.length})` : ''}
                                  </h6>
                                  {items.map(item => {
                                    let className = '';
                                    if (item.highlight) {
                                      className = 'highlightItem';
                                    } else if (item.selected) {
                                      className = 'selectedItem';
                                    }
                                    return (
                                      <div key={item.id} className={className} onClick={() => selectResource(item.id)}>
                                        {hasIncomingRefs(item) ? '>> ' : ''}
                                        {item.name}
                                        {hasOutgoingRefs(item) ? ' >>' : ''}
                                        {hasUnsatisfiedRefs(item) ? ' ??' : ''}
                                      </div>
                                    );
                                  })}
                                </SectionCol>
                              );
                            })}
                          </SectionRow>
                        </>
                      );
                    })}
                  </SectionCol>
                </SectionRow>
              </>
            );
          })}
        </SectionCol>
      </SectionRow>
    </PaneContainer>
  );
};

export default NavigatorPane;
