import type { ChangeEvent } from 'react';
import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { Form } from 'react-bootstrap';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useMutation, useQuery } from '@apollo/client';
import Button from 'react-bootstrap/Button';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import styles from './OrgList.module.css';
import SuperDashListCard from 'components/SuperDashListCard/SuperDashListCard';
import {
  ORGANIZATION_CONNECTION_LIST,
  USER_ORGANIZATION_LIST,
} from 'GraphQl/Queries/Queries';
import { CREATE_ORGANIZATION_MUTATION } from 'GraphQl/Mutations/mutations';
import ListNavbar from 'components/ListNavbar/ListNavbar';
import PaginationList from 'components/PaginationList/PaginationList';
import debounce from 'utils/debounce';
import convertToBase64 from 'utils/convertToBase64';
import AdminDashListCard from 'components/AdminDashListCard/AdminDashListCard';
import { Alert, AlertTitle } from '@mui/material';
import { errorHandler } from 'utils/errorHandler';

function orgList(): JSX.Element {
  const { t } = useTranslation('translation', { keyPrefix: 'orgList' });

  document.title = t('title');

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    descrip: '',
    ispublic: true,
    visible: false,
    location: '',
    image: '',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const isSuperAdmin = localStorage.getItem('UserType') !== 'SUPERADMIN';

  const toggleAddEventModal = (): void =>
    setShowAddEventModal(!showAddEventModal);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [create, { loading: loading3 }] = useMutation(
    CREATE_ORGANIZATION_MUTATION
  );

  const {
    data: data2,
    loading: loading2,
    error: errorUser,
  } = useQuery(USER_ORGANIZATION_LIST, {
    variables: { id: localStorage.getItem('id') },
  });

  const {
    data,
    loading,
    error: errorList,
    refetch,
  } = useQuery(ORGANIZATION_CONNECTION_LIST);
  /*istanbul ignore next*/
  interface InterfaceUserType {
    adminFor: {
      _id: string;
    }[];
  }
  /*istanbul ignore next*/
  interface InterfaceCurrentOrgType {
    _id: string;
  }
  /*istanbul ignore next*/
  const isAdminForCurrentOrg = (
    user: InterfaceUserType | undefined,
    currentOrg: InterfaceCurrentOrgType
  ): boolean => {
    return (
      user?.adminFor.length === 1 && user?.adminFor[0]._id === currentOrg._id
    );
  };

  const createOrg = async (e: ChangeEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const {
      name: _name,
      descrip: _descrip,
      location: _location,
      visible,
      ispublic,
      image,
    } = formState;

    const name = _name.trim();
    const descrip = _descrip.trim();
    const location = _location.trim();

    try {
      const { data } = await create({
        variables: {
          name: name,
          description: descrip,
          location: location,
          visibleInSearch: visible,
          isPublic: ispublic,
          image: image,
        },
      });

      /* istanbul ignore next */
      if (data) {
        toast.success('Congratulation the Organization is created');
        refetch();
        setFormState({
          name: '',
          descrip: '',
          ispublic: true,
          visible: false,
          location: '',
          image: '',
        });
        toggleAddEventModal();
      }
    } catch (error: any) {
      /* istanbul ignore next */
      errorHandler(t, error);
    }
  };

  if (loading || loading2 || loading3) {
    return (
      <>
        <div className={styles.loader}></div>
      </>
    );
  }

  /* istanbul ignore next */
  if (errorList || errorUser) {
    window.location.assign('/');
  }

  /* istanbul ignore next */
  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ): void => {
    setPage(newPage);
  };

  /* istanbul ignore next */
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchByName = (e: any): void => {
    const { value } = e.target;
    refetch({
      filter: value,
    });
  };
  let dataRevOrg;
  const debouncedHandleSearchByName = debounce(handleSearchByName);
  if (data) {
    dataRevOrg = data.organizationsConnection.slice().reverse();
  }
  return (
    <>
      <ListNavbar />
      <Row>
        <Col xl={3}>
          <div className={styles.sidebar}>
            <div className={`${styles.mainpageright} ${styles.sidebarsticky}`}>
              <h6 className={`${styles.logintitle} ${styles.youheader}`}>
                {t('you')}
              </h6>
              <p>
                {t('name')}:
                <span>
                  {data2?.user.firstName} {data2?.user.lastName}
                </span>
              </p>
              <p>
                {t('designation')}:<span> {data2?.user.userType}</span>
              </p>
              <div className={styles.userEmail}>
                {t('email')}:
                <p>
                  {(data2?.user.email || '').substring(
                    0,
                    (data2?.user.email || '').length / 2
                  )}
                  <span>
                    {data2?.user.email.substring(
                      data2?.user.email.length / 2,
                      data2?.user.email.length
                    )}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Col>
        <Col xl={8} className={styles.mainpagerightContainer}>
          <div className={styles.mainpageright} data-testid="mainpageright">
            <div className={styles.justifysp}>
              <p className={styles.logintitle}>{t('organizationList')}</p>
            </div>
            <div className={styles.search}>
              <Button
                variant="success"
                className={styles.invitebtn}
                disabled={isSuperAdmin}
                onClick={toggleAddEventModal}
                data-testid="createOrganizationBtn"
                style={{ display: isSuperAdmin ? 'none' : 'block' }}
              >
                + {t('createOrganization')}
              </Button>
              <Form.Control
                type="name"
                id="orgname"
                placeholder="Search Organization"
                data-testid="searchByName"
                autoComplete="off"
                required
                onChange={debouncedHandleSearchByName}
                style={{
                  display:
                    data2 && data2.user.userType !== 'SUPERADMIN'
                      ? 'none'
                      : 'block',
                }}
              />
            </div>
            <div className={styles.list_box} data-testid="organizations-list">
              {data?.organizationsConnection.length > 0 ? (
                (rowsPerPage > 0
                  ? dataRevOrg.slice(
                      page * rowsPerPage,
                      page * rowsPerPage + rowsPerPage
                    )
                  : data.organizationsConnection
                ).map(
                  (datas: {
                    _id: string;
                    image: string;
                    name: string;
                    admins: any;
                    members: any;
                    createdAt: string;
                    location: string | null;
                  }) => {
                    if (data2 && data2.user.userType == 'SUPERADMIN') {
                      return (
                        <SuperDashListCard
                          id={datas._id}
                          key={datas._id}
                          image={datas.image}
                          admins={datas.admins}
                          members={datas.members.length}
                          createdDate={dayjs(datas?.createdAt).format(
                            'MMMM D, YYYY'
                          )}
                          orgName={datas.name}
                          orgLocation={datas.location}
                        />
                      );
                    } else if (isAdminForCurrentOrg(data2?.user, datas)) {
                      /* istanbul ignore next */
                      return (
                        <AdminDashListCard
                          id={datas._id}
                          key={datas._id}
                          image={datas.image}
                          admins={datas.admins}
                          members={datas.members.length}
                          createdDate={dayjs(datas?.createdAt).format(
                            'MMMM D, YYYY'
                          )}
                          orgName={datas.name}
                          orgLocation={datas.location}
                        />
                      );
                    } else {
                      return null;
                    }
                  }
                )
              ) : (
                <div>
                  <Alert variant="filled" severity="error">
                    <AlertTitle>{t('noOrgErrorTitle')}</AlertTitle>
                    {t('noOrgErrorDescription')}
                  </Alert>
                </div>
              )}
            </div>
            <div>
              <table
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <tbody>
                  {data2?.user.userType === 'SUPERADMIN' && (
                    <tr data-testid="rowsPPSelect">
                      <PaginationList
                        count={data ? data.organizationsConnection.length : 0}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Col>
      </Row>
      <Modal show={showAddEventModal} onHide={toggleAddEventModal}>
        <Modal.Header>
          <p className={styles.titlemodal}>{t('createOrganization')}</p>
          <Button
            variant="danger"
            onClick={toggleAddEventModal}
            data-testid="closeOrganizationModal"
          >
            <i
              className="fa fa-times"
              style={{
                cursor: 'pointer',
              }}
            ></i>
          </Button>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmitCapture={createOrg}>
            <label htmlFor="orgname">{t('name')}</label>
            <Form.Control
              type="name"
              id="orgname"
              placeholder={t('enterName')}
              data-testid="modalOrganizationName"
              autoComplete="off"
              required
              value={formState.name}
              onChange={(e): void => {
                setFormState({
                  ...formState,
                  name: e.target.value,
                });
              }}
            />
            <label htmlFor="descrip">{t('description')}</label>
            <Form.Control
              type="descrip"
              id="descrip"
              placeholder={t('description')}
              autoComplete="off"
              required
              value={formState.descrip}
              onChange={(e): void => {
                setFormState({
                  ...formState,
                  descrip: e.target.value,
                });
              }}
            />
            <label htmlFor="location">{t('location')}</label>
            <Form.Control
              type="text"
              id="location"
              placeholder={t('location')}
              autoComplete="off"
              required
              value={formState.location}
              onChange={(e): void => {
                setFormState({
                  ...formState,
                  location: e.target.value,
                });
              }}
            />

            <div className={styles.checkboxdiv}>
              <div className={styles.dispflex}>
                <label htmlFor="ispublic">{t('isPublic')}:</label>
                <Form.Switch
                  id="ispublic"
                  type="checkbox"
                  className={'ms-3'}
                  defaultChecked={formState.ispublic}
                  onChange={(): void =>
                    setFormState({
                      ...formState,
                      ispublic: !formState.ispublic,
                    })
                  }
                />
              </div>
              <div className={styles.dispflex}>
                <label htmlFor="visible">{t('visibleInSearch')}: </label>
                <Form.Switch
                  id="visible"
                  type="checkbox"
                  className={'ms-3'}
                  defaultChecked={formState.visible}
                  onChange={(): void =>
                    setFormState({
                      ...formState,
                      visible: !formState.visible,
                    })
                  }
                />
              </div>
            </div>
            <label htmlFor="orgphoto" className={styles.orgphoto}>
              {t('displayImage')}:
              <Form.Control
                accept="image/*"
                id="orgphoto"
                name="photo"
                type="file"
                multiple={false}
                onChange={async (e: React.ChangeEvent): Promise<void> => {
                  const target = e.target as HTMLInputElement;
                  const file = target.files && target.files[0];
                  if (file)
                    setFormState({
                      ...formState,
                      image: await convertToBase64(file),
                    });
                }}
                data-testid="organisationImage"
              />
            </label>
            <Button
              type="submit"
              className={styles.greenregbtn}
              value="invite"
              data-testid="submitOrganizationForm"
            >
              {t('createOrganization')}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default orgList;
