import styled from 'styled-components';

export const OverviewWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
`;

export const SideNav = styled.nav`
  width: 240px;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
`;

export const NavItem = styled.div<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  color: #3c3c3c;
  font-weight: ${props => props.isActive ? '700' : '500'};
  font-size: 15px;
  
  &:hover {
    background-color: #f7f7f7;
  }
  
  svg {
    margin-right: 12px;
    width: 24px;
    height: 24px;
    color: ${props => props.isActive ? '#58cc02' : '#afafaf'};
  }
`;

export const MainContent = styled.main`
  flex: 1;
  padding: 24px;
  margin-left: 240px; /* Same as SideNav width */
  background-color: #fff;
`;

export const Logo = styled.div`
  padding: 0 16px 20px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e5e5e5;
  
  img {
    height: 32px;
  }
`;
