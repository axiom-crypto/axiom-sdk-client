import * as ts from "typescript";

const getNameFromNode = (node?: ts.Node) => {
    if (!node) return;
    if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
        return node.text;
    }
    return;
}

const findInterfaceDeclaration = (node: ts.Node, typeName: string) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
        return node;
    }
    let foundInterface: ts.InterfaceDeclaration | undefined;
    ts.forEachChild(node, child => {
        if (!foundInterface) {
            foundInterface = findInterfaceDeclaration(child, typeName);
        }
    });
    return foundInterface;
}

const formatInterfaceMembers = (interfaceDeclaration: ts.InterfaceDeclaration) => {
    const out: any = {};
    interfaceDeclaration.members.forEach(member => {
        if (ts.isPropertySignature(member)) {
            const memberName = member.name?.getText();
            const memberType = member.type?.getText();
            out[memberName] = memberType;
        }
    })

    return JSON.stringify(out);
}

const convertInlineTypeToJsonString = (typeNode: ts.TypeNode) => {
    const out: any = {};
    if (ts.isTypeLiteralNode(typeNode)) {
        typeNode.members.forEach(member => {
            if (ts.isPropertySignature(member) && member.name && member.type) {
                const key = member.name.getText();
                const type = member.type.getText();
                out[key] = type;
            }
        })
        return JSON.stringify(out);
    }
    throw new Error("Function input must be an object");
}


export const extractFunctionInterface = (sourceCode: string, functionName: string) => {
    const sourceFile = ts.createSourceFile('temp.ts', sourceCode, ts.ScriptTarget.Latest, true);

    let functionTypeNode: ts.TypeNode | undefined;
    let interfaceName: string | undefined;

    const processNode = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || (ts.isVariableDeclaration(node) && node.initializer && ts.isArrowFunction(node.initializer))) {
            const name = ts.isVariableDeclaration(node) ? getNameFromNode(node.name) : getNameFromNode(node.name);
            if (name === functionName) {
                const functionNode = ts.isVariableDeclaration(node) ? node.initializer as ts.ArrowFunction : node;
                if(functionNode.parameters.length !== 1) throw new Error("Only one parameter is allowed for the function");
                interfaceName = functionNode.parameters[0].type?.getText(sourceFile);
                functionTypeNode = functionNode.parameters[0].type;
            }
        }
        ts.forEachChild(node, processNode);
    }

    processNode(sourceFile);

    if (functionTypeNode && interfaceName) {
        const isNamedType = /^[A-Z]/.test(interfaceName);
        if (isNamedType) {
            const interfaceDeclaration = findInterfaceDeclaration(sourceFile, interfaceName);
            if (interfaceDeclaration) {
                return formatInterfaceMembers(interfaceDeclaration);
            }
        } else {
            return convertInlineTypeToJsonString(functionTypeNode);
        }
    }
    throw new Error("Could not find function");
}