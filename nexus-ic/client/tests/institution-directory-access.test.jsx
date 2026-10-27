import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InstitutionLookup from '../src/pages/institutions/InstitutionLookup.jsx';
vi.mock('../src/context/AuthContext.jsx',()=>({useAuth:()=>({user:null})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('anonymous directory visitors get a sign-in return link without issuing protected API requests',()=>{
 vi.stubGlobal('fetch',vi.fn());render(<MemoryRouter><InstitutionLookup/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Explore the institution registry'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Sign in to search institutions'})).toHaveAttribute('href','/login?next=/institutions/lookup');
 expect(fetch).not.toHaveBeenCalled();
});
