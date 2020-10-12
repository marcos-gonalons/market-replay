import React, { useContext, useState } from "react";
import Modal from "react-modal";
import { setIsScriptsPanelVisible } from "../../context/globalContext/Actions";
import { GlobalContext } from "../../context/globalContext/GlobalContext";

import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";

import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";

import styles from "./ScriptsPanel.module.css";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible },
    dispatch,
  } = useContext(GlobalContext);

  const [code, setCode] = useState<string>(`
  import React from 'react';
  import Editor from 'react-simple-code-editor';
  import { highlight, languages } from 'prismjs/components/prism-core';
  import 'prismjs/components/prism-clike';
  import 'prismjs/components/prism-javascript';
   
  
  1 + 1;
  
  const code = \`function add(a, b) {
    return a + b;
  }
  \`;
   
  class App extends React.Component {
    state = { code };
   
    render() {
      return (
        <Editor
          value={this.state.code}
          onValueChange={code => this.setState({ code })}
          highlight={code => highlight(code, languages.js)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
      );
    }
    
   
    render() {
      return (
        <Editor
          value={this.state.code}
          onValueChange={code => this.setState({ code })}
          highlight={code => highlight(code, languages.js)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
      );
    }
    
   
    render() {
      return (
        <Editor
          value={this.state.code}
          onValueChange={code => this.setState({ code })}
          highlight={code => highlight(code, languages.js)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
      );
    }
  }
  `);

  if (!isScriptsPanelVisible) {
    return <></>;
  }
  return (
    <Modal
      ariaHideApp={false}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      isOpen={true}
      onRequestClose={() => dispatch(setIsScriptsPanelVisible(false))}
    >
      <article className={styles["modal-container"]}>
        <button tabIndex={-1} className={styles["x"]} onClick={() => dispatch(setIsScriptsPanelVisible(false))}>
          X
        </button>
        <section className={styles["contents"]}>
          <aside className={styles["script-names"]}>
            <div>name1</div>
            <div>name2</div>
          </aside>
          <section className={styles["script-contents"]}>
            <Editor
              value={code}
              onValueChange={setCode}
              highlight={(code) => highlight(code, languages.js, "js")}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
              }}
              preClassName={"language-markup"}
            />
          </section>
        </section>
      </article>
    </Modal>
  );
}

export default ScriptsPanel;
